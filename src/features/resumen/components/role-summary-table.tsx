"use client";

interface RoleSummary {
  id: number;
  cargo: string;
  prioridades: number;
  objetivos: number;
  proyectos: number;
  ico: number;
  icp: number;
}

interface RoleSummaryTableProps {
  roles: RoleSummary[];
  hoveredId: number | null;
  setHoveredId: (id: number | null) => void;
}

export function RoleSummaryTable({
  roles,
  hoveredId,
  setHoveredId,
}: RoleSummaryTableProps) {
  const total = {
    prioridades: roles.reduce((acc, r) => acc + r.prioridades, 0),
    objetivos: roles.reduce((acc, r) => acc + r.objetivos, 0),
    proyectos: roles.reduce((acc, r) => acc + r.proyectos, 0),
  };

  const getBadgeClass = (value: number) => {
    if (value >= 90) return "bg-green-100 text-green-700";
    if (value >= 70) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="border-0 shadow-sm bg-white/50 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 heading-optimized">
        Role Summary Table
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-600 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3 text-center">Priorities</th>
              <th className="px-6 py-3 text-center">Objectives</th>
              <th className="px-6 py-3 text-center">Projects</th>
              <th className="px-6 py-3 text-center">ICO</th>
              <th className="px-6 py-3 text-center">ICP</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr
                key={r.id}
                className={`border-b hover:bg-gray-50 ${
                  hoveredId === r.id ? "bg-blue-50" : ""
                }`}
                onMouseEnter={() => setHoveredId(r.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  {r.cargo}
                </td>
                <td className="px-6 py-4 text-center">{r.prioridades}</td>
                <td className="px-6 py-4 text-center">{r.objetivos}</td>
                <td className="px-6 py-4 text-center">{r.proyectos}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getBadgeClass(
                      r.ico
                    )}`}
                  >
                    {r.ico}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getBadgeClass(
                      r.icp
                    )}`}
                  >
                    {r.icp}%
                  </span>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-medium">
              <td className="px-6 py-4 text-gray-900">Total</td>
              <td className="px-6 py-4 text-center">{total.prioridades}</td>
              <td className="px-6 py-4 text-center">{total.objetivos}</td>
              <td className="px-6 py-4 text-center">{total.proyectos}</td>
              <td className="px-6 py-4 text-center">-</td>
              <td className="px-6 py-4 text-center">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
