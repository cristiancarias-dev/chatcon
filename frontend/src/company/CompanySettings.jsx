import { useState, useEffect } from "react";
import { useCompany, useUpdateCompany } from "../hooks/useCompany";
import Loading from "../shared/Loading";
import ErrorAlert from "../shared/ErrorAlert";

export default function CompanySettings() {
  const { data: company, isLoading } = useCompany();
  const updateCompany = useUpdateCompany();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setEmail(company.email || "");
      setPhone(company.phone || "");
      setAddress(company.address || "");
    }
  }, [company]);

  if (isLoading) return <Loading />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await updateCompany.mutateAsync({
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
      });
      setSuccess("Company updated successfully");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="mt-1 text-gray-500">Manage your company information</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field mt-1.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1.5"
              placeholder="company@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field mt-1.5"
              placeholder="+1 234 567 890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field mt-1.5"
              placeholder="123 Main St, City, Country"
            />
          </div>

          <ErrorAlert message={error} />

          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={updateCompany.isPending}
            className="btn-primary"
          >
            {updateCompany.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
