import gzip
import json
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any

from bson import Binary


EVENT_TYPE = ("stpdatafromtrain", "stpdatatotrain")

MESSAGES: dict[int, str] = {
    2: "SR Authorisation",
    3: "Movement Authority",
    4: "SM Authorisation",
    5: "SM Refused",
    6: "Recognition of exit from TRIP mode",
    7: "Acknowledgement of safe consist length info for SM",
    8: "Acknowledgement of Train Data",
    9: "Request to Shorten MA",
    15: "Conditional Emergency Stop",
    16: "Unconditional Emergency Stop",
    18: "Revocation of Emergency Stop",
    24: "General message",
    27: "SH Refused",
    28: "SH Authorised",
    32: "RBC/RIU System Version",
    33: "MA with Shifted Location Reference",
    34: "Track Ahead Free Request",
    37: "Infill MA",
    38: "Acknowledgement of session establishment",
    39: "Acknowledgement of termination of a communication session",
    40: "Train Rejected",
    41: "Train Accepted",
    43: "SoM position report confirmed by RBC",
    45: "Assignment of coordinate system",
    129: "Validated Train Data",
    130: "Request for Shunting",
    131: "Request for Supervised Manoeuvre",
    132: "MA Request",
    133: "Safe consist length information for Supervised Manoeuvre",
    136: "Train Position Report",
    137: "Request to shorten MA is granted",
    138: "Request to shorten MA is rejected",
    146: "Acknowledgement",
    147: "Acknowledgement of Emergency Stop",
    149: "Track Ahead Free Granted",
    150: "End of Mission",
    153: "Radio infill request",
    154: "No compatible version supported",
    155: "Initiation of a communication session",
    156: "Termination of a communication session",
    157: "SoM Position Report",
    158: "Text message acknowledged by driver",
    159: "Session Established",
}


def parse_timestamp(timestamp: str) -> datetime | None:
    if not timestamp:
        return None
    ts = timestamp.strip()

    for fmt in ("%Y-%m-%d %H:%M:%S.%f %z", "%Y-%m-%d %H:%M:%S %z"):
        try:
            return datetime.strptime(ts, fmt)
        except Exception:
            pass
    return None


def text(el: ET.Element) -> str:
    return (el.text or "").strip()


def element_to_obj(el: ET.Element) -> Any:
    """
    Recursively convert XML element to Python objects.

    Safe behavior:
    - If repeated tags appear, we overwrite (last wins) instead of raising.
    """
    children = list(el)
    if not children:
        return text(el)

    obj: dict[str, Any] = {}
    for child in children:
        obj[child.tag] = element_to_obj(child)

    t = text(el)
    if t:
        obj["_text"] = t
    return obj


class XmlParser:
    def __init__(self, input_xml: bytes, store_raw: bool = True):
        self.store_raw = store_raw
        self.root = ET.fromstring(input_xml)
        self.events = list(self.root.findall(".//event"))
        self.train_ids = self.get_id_trains()

    def get_id_trains(self) -> list[str | int]:
        ids: set[str | int] = set()
        for event in self.events:
            peer = (event.findtext("peer_etcs_id") or "").strip()
            if not peer:
                continue
            ids.add(int(peer) if peer.isdigit() else peer)

        # ints first then strings
        ints = sorted([v for v in ids if isinstance(v, int)])
        strs = sorted([v for v in ids if isinstance(v, str)])
        return ints + strs

    def get_direction_symbol(self, event_type: str) -> str:
        t = (event_type or "").strip().lower()
        if t == EVENT_TYPE[0]:  # stpdatafromtrain
            return "--------->"  # OBU->RBC
        if t == EVENT_TYPE[1]:  # stpdatatotrain
            return "<---------"  # RBC->OBU
        return ""

    def build_full_events(self) -> list[dict[str, Any]]:
        """Build full events in same sorted order as rows for index matching."""
        def sort_key(ev: ET.Element) -> str:
            return ev.findtext("timestamp", "") or ""
        
        events_list = []
        for idx, event in enumerate(sorted(self.events, key=sort_key), 1):
            raw_obj = element_to_obj(event)
            raw_obj["index"] = idx  # Add index for matching with rows
            events_list.append(raw_obj)
        return events_list

    def build_msg_row(self, idx: int, event: ET.Element) -> dict[str, Any] | None:
        message_id = (event.findtext("nid_message") or "").strip()
        peer_id = (event.findtext("peer_etcs_id") or "").strip()

        if not message_id or not peer_id or not message_id.isdigit():
            return None

        nid_message = int(message_id)

        timestamp_text = (event.findtext("timestamp") or "").strip()
        event_type = (event.findtext("type") or "").strip()

        return {
            "index": idx,
            "timestamp_text": timestamp_text,
            "timestamp": parse_timestamp(timestamp_text),
            "direction_symbol": self.get_direction_symbol(event_type),
            "train_id": int(peer_id) if peer_id.isdigit() else peer_id,
            "nid_message": nid_message,
            "message_code": f"M{nid_message}",
            "message_name": MESSAGES.get(nid_message, f"ID {nid_message} not found"),
            "raw": element_to_obj(event) if self.store_raw else {},
        }

    def get_message_rows(self) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        def sort_key(ev: ET.Element) -> str:
            return ev.findtext("timestamp", "") or ""

        rows_all: list[dict[str, Any]] = []
        rows_without: list[dict[str, Any]] = []

        for idx, event in enumerate(sorted(self.events, key=sort_key), 1):
            row = self.build_msg_row(idx, event)
            if not row:
                continue

            rows_all.append(row)
            if row["nid_message"] not in (24, 136):
                rows_without.append(row)

        return rows_all, rows_without


def parse_events_xml(xml_bytes: bytes, store_full_events: bool = True) -> dict[str, Any]:
    # For large files, don't store raw data in rows to save space
    store_raw = len(xml_bytes) <= 15 * 1024 * 1024  # 15MB threshold
    
    parser = XmlParser(xml_bytes, store_raw=store_raw)
    rows_all, rows_without = parser.get_message_rows()

    events_compressed = None
    if store_full_events:
        events = parser.build_full_events()
        events_json = json.dumps(events, default=str)  # Handle datetime serialization
        events_compressed = Binary(gzip.compress(events_json.encode()))

    return {
        "train_ids": parser.train_ids,
        "rows_all": rows_all,
        "rows_without_24_136": rows_without,
        "events_compressed": events_compressed,
    }