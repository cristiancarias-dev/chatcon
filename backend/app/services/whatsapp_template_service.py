import json

from app.exceptions import NotFoundException
from app.models.whatsapp_template import WhatsAppTemplate
from app.providers.whatsapp import WhatsAppProvider
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository
from app.repositories.whatsapp_template_repository import WhatsAppTemplateRepository
from app.schemas.whatsapp_template import WhatsAppTemplateCreate, WhatsAppTemplateRead


class WhatsAppTemplateService:
    def __init__(
        self,
        template_repo: WhatsAppTemplateRepository,
        account_repo: WhatsAppAccountRepository,
    ):
        self.template_repo = template_repo
        self.account_repo = account_repo

    def _to_read(self, t: WhatsAppTemplate) -> WhatsAppTemplateRead:
        return WhatsAppTemplateRead(
            id=t.id,
            account_id=t.account_id,
            name=t.name,
            language=t.language,
            category=t.category,
            status=t.status,
            meta_template_id=t.meta_template_id,
            components=t.components,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )

    def _get_provider(self, account_id: int) -> WhatsAppProvider:
        account = self.account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundException("WhatsApp account not found")
        if not account.business_account_id:
            raise ValueError("WhatsApp account has no WABA ID (business_account_id)")
        return WhatsAppProvider(account)

    def list_templates(self, account_id: int) -> list[WhatsAppTemplateRead]:
        return [self._to_read(t) for t in self.template_repo.get_by_account(account_id)]

    def refresh_from_meta(self, account_id: int) -> list[WhatsAppTemplateRead]:
        provider = self._get_provider(account_id)
        meta_templates = provider.get_templates()

        existing = {t.name: t for t in self.template_repo.get_by_account(account_id)}

        for mt in meta_templates:
            name = mt.get("name")
            if name in existing:
                t = existing[name]
                t.status = mt.get("status", t.status)
                t.category = mt.get("category", t.category)
                t.meta_template_id = mt.get("id")
                t.components = json.dumps(mt.get("components", []))
            else:
                t = WhatsAppTemplate(
                    account_id=account_id,
                    name=name,
                    language=mt.get("language", "en_US"),
                    category=mt.get("category", "MARKETING"),
                    status=mt.get("status", "PENDING"),
                    meta_template_id=mt.get("id"),
                    components=json.dumps(mt.get("components", [])),
                )
                self.template_repo.create(t)

        return self.list_templates(account_id)

    def create_template(
        self, account_id: int, data: WhatsAppTemplateCreate
    ) -> WhatsAppTemplateRead:
        provider = self._get_provider(account_id)
        resp = provider.create_template(
            name=data.name,
            language=data.language,
            category=data.category,
            components=data.components,
        )
        t = WhatsAppTemplate(
            account_id=account_id,
            name=data.name,
            language=data.language,
            category=resp.get("category", data.category),
            status=resp.get("status", "PENDING"),
            meta_template_id=resp.get("id"),
            components=json.dumps(data.components),
        )
        t = self.template_repo.create(t)
        return self._to_read(t)

    def delete_template(self, template_id: int) -> None:
        t = self.template_repo.get_by_id(template_id)
        if not t:
            raise NotFoundException("Template not found")
        try:
            provider = self._get_provider(t.account_id)
            provider.delete_template_by_name(t.name)
        except Exception:
            pass
        self.template_repo.delete_by_id(template_id)
