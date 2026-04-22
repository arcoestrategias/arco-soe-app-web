export function FactorTableHeader() {
  return (
    <div className="bg-blue-50">
      <div className="grid grid-cols-[35%_35%_20%_10%]">
        <div className="flex items-center px-3 py-2">
          <span className="text-[10px] font-medium text-gray-700 uppercase tracking-wide">
            Factor
          </span>
        </div>
        <div className="flex items-center px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Resultado
          </span>
        </div>
        <div className="flex items-center justify-center px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Progreso
          </span>
        </div>
        <div className="flex items-center justify-end px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Acciones
          </span>
        </div>
      </div>
    </div>
  );
}
