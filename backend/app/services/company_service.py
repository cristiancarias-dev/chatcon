from app.exceptions import NotFoundException
from app.models.company import Company
from app.repositories.company_repository import CompanyRepository
from app.schemas.company import CompanyCreate, CompanyUpdate


class CompanyService:
    def __init__(self, repo: CompanyRepository):
        self.repo = repo

    def get_by_id(self, company_id: int) -> Company:
        company = self.repo.get_by_id(company_id)
        if not company:
            raise NotFoundException("Company not found")
        return company

    def update(self, company_id: int, data: CompanyUpdate) -> Company:
        company = self.get_by_id(company_id)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)
        return self.repo.save(company)
