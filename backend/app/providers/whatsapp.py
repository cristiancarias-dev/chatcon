import json
import logging

import httpx

from app.crypto import decrypt_value
from app.models.whatsapp_account import WhatsAppAccount

log = logging.getLogger(__name__)
META_API_BASE = "https://graph.facebook.com"


class WhatsAppError(Exception):
    def __init__(self, code: int, title: str, details: str = ""):
        self.code = code
        self.title = title
        self.details = details
        super().__init__(f"[{code}] {title}: {details}")


class WhatsAppProvider:
    def __init__(self, account: WhatsAppAccount):
        self.account = account
        self.access_token = decrypt_value(account.access_token_encrypted)
        self.phone_number_id = account.phone_number_id
        self.business_account_id = account.business_account_id
        self.api_version = account.api_version

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    def _messages_url(self) -> str:
        return f"{META_API_BASE}/{self.api_version}/{self.phone_number_id}/messages"

    def _waba_url(self, path: str = "") -> str:
        base = f"{META_API_BASE}/{self.api_version}/{self.business_account_id}"
        return f"{base}/{path}" if path else base

    def _request(self, method: str, url: str, payload: dict | None = None) -> dict:
        with httpx.Client() as client:
            if method == "GET":
                resp = client.get(url, headers=self._headers(), params=payload)
            else:
                resp = client.request(method, url, json=payload, headers=self._headers())
            data = resp.json()
            errors = data.get("errors")
            if errors:
                err = errors[0]
                code = err.get("code", 0)
                title = err.get("title", "Unknown error")
                details = (err.get("error_data") or {}).get("details", "")
                raise WhatsAppError(code, title, details)
            resp.raise_for_status()
            return data

    def _post(self, payload: dict) -> dict:
        return self._request("POST", self._messages_url(), payload)

    # --- Messaging ---

    def send_text(self, to: str, text: str) -> dict:
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": text},
        }
        return self._post(payload)

    def send_template(
        self, to: str, template_name: str, body_params: list[str] | None = None
    ) -> dict:
        components = []
        if body_params:
            components.append(
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": p} for p in body_params],
                }
            )
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en"},
                "components": components,
            },
        }
        return self._post(payload)

    # --- Template Management ---

    def get_templates(self) -> list[dict]:
        url = self._waba_url("message_templates")
        data = self._request("GET", url)
        return data.get("data", [])

    def get_template_by_name(self, name: str) -> list[dict]:
        url = self._waba_url("message_templates")
        data = self._request("GET", url, {"name": name})
        return data.get("data", [])

    def create_template(self, name: str, language: str, category: str, components: list) -> dict:
        url = self._waba_url("message_templates")
        payload = {
            "name": name,
            "language": language,
            "category": category,
            "components": components,
        }
        return self._request("POST", url, payload)

    def delete_template_by_name(self, name: str) -> dict:
        url = self._waba_url("message_templates")
        return self._request("DELETE", url, {"name": name})

    # --- Webhook Subscription ---

    def subscribe_to_waba(self) -> dict:
        url = self._waba_url("subscribed_apps")
        return self._request("POST", url)

    def get_subscriptions(self) -> list[dict]:
        url = self._waba_url("subscribed_apps")
        data = self._request("GET", url)
        return data.get("data", [])
