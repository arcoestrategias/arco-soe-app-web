// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Upload, FileText, Download, Trash2, Eye } from "lucide-react";
// import { useState } from "react";
// import type { Documento } from "../types";
// import { fmt } from "@/shared/utils/fmt";

// interface SectionDocumentsProps {
//   titulo: string;
//   documentos: Documento[];
//   onDocumentosChange: (documentos: Documento[]) => void;
//   readonly?: boolean;
// }

// export function SectionDocuments({
//   titulo,
//   documentos,
//   onDocumentosChange,
//   readonly = false,
// }: SectionDocumentsProps) {
//   const [dragOver, setDragOver] = useState(false);

//   const handleUpload = (files: FileList | null) => {
//     if (!files || readonly) return;

//     const nuevos: Documento[] = Array.from(files).map((file) => ({
//       id: crypto.randomUUID(),
//       nombre: file.name,
//       tipo: file.type || "application/octet-stream",
//       tamaño: file.size,
//       url: URL.createObjectURL(file),
//       fechaSubida: new Date().toISOString(),
//       subidoPor: "Usuario Actual",
//     }));

//     onDocumentosChange([...documentos, ...nuevos]);
//   };

//   const eliminar = (id: string) => {
//     if (readonly) return;
//     onDocumentosChange(documentos.filter((d) => d.id !== id));
//   };

//   const formatear = (bytes: number) => {
//     const k = 1024;
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return `${(bytes / Math.pow(k, i)).toFixed(2)} ${
//       ["Bytes", "KB", "MB", "GB"][i]
//     }`;
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="text-lg font-semibold text-gray-900">
//           {titulo}
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {!readonly && (
//           <div
//             className={`border-2 border-dashed rounded-lg p-6 text-center ${
//               dragOver
//                 ? "border-orange-400 bg-orange-50"
//                 : "border-gray-300 hover:border-gray-400"
//             }`}
//             onDrop={(e) => {
//               e.preventDefault();
//               setDragOver(false);
//               handleUpload(e.dataTransfer.files);
//             }}
//             onDragOver={(e) => {
//               e.preventDefault();
//               setDragOver(true);
//             }}
//             onDragLeave={() => setDragOver(false)}
//           >
//             <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
//             <p className="text-sm text-gray-600 mb-2">
//               Arrastra archivos aquí o selecciona
//             </p>
//             <input
//               id="file-upload"
//               type="file"
//               multiple
//               onChange={(e) => handleUpload(e.target.files)}
//               className="hidden"
//             />
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => document.getElementById("file-upload")?.click()}
//             >
//               Seleccionar Archivos
//             </Button>
//           </div>
//         )}

//         {/* Lista */}
//         <div className="space-y-2">
//           {documentos.length === 0 ? (
//             <div className="text-center py-8 text-gray-500">
//               <FileText className="mx-auto h-8 w-8 mb-2" />
//               <p>No hay documentos cargados</p>
//             </div>
//           ) : (
//             documentos.map((d) => (
//               <div
//                 key={d.id}
//                 className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
//               >
//                 <div className="flex items-center space-x-3 flex-1">
//                   <span className="text-lg">📎</span>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-gray-900 truncate">
//                       {d.nombre}
//                     </p>
//                     <div className="flex items-center space-x-2 mt-1">
//                       <Badge variant="secondary" className="text-xs">
//                         {formatear(d.tamaño)}
//                       </Badge>
//                       <span className="text-xs text-gray-500">
//                         {fmt.format(new Date(d.fechaSubida))}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-1">
//                   <Button variant="ghost" size="icon" className="h-8 w-8">
//                     <Eye className="h-4 w-4" />
//                   </Button>
//                   <Button variant="ghost" size="icon" className="h-8 w-8">
//                     <Download className="h-4 w-4" />
//                   </Button>
//                   {!readonly && (
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="h-8 w-8 text-red-600 hover:text-red-700"
//                       onClick={() => eliminar(d.id)}
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
