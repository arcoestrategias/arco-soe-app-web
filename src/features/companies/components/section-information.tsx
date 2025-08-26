// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { Upload, X } from "lucide-react";
// import { useState, type ChangeEvent } from "react";

// interface SectionInformationProps {
//   titulo: string;
//   datos: {
//     nombre: string;
//     identificacion: string;
//     descripcion: string;
//     logo?: string;
//   };
//   onDatosChange: (datos: any) => void;
//   readonly?: boolean;
// }

// export function SectionInformation({
//   titulo,
//   datos,
//   onDatosChange,
//   readonly = false,
// }: SectionInformationProps) {
//   const [logoPreview, setLogoPreview] = useState<string | null>(
//     datos.logo || null
//   );

//   const handleInputChange = (field: string, value: string) => {
//     if (readonly) return;
//     onDatosChange({ ...datos, [field]: value });
//   };

//   const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
//     if (readonly) return;
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const result = e.target?.result as string;
//         setLogoPreview(result);
//         onDatosChange({ ...datos, logo: result });
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleRemoveLogo = () => {
//     if (readonly) return;
//     setLogoPreview(null);
//     onDatosChange({ ...datos, logo: undefined });
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="text-lg font-semibold text-gray-900">
//           {titulo}
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         {/* Logo */}
//         <div className="space-y-2">
//           <Label htmlFor="logo">Logo de la Empresa</Label>
//           <div className="flex items-center space-x-4">
//             {logoPreview ? (
//               <div className="relative">
//                 <img
//                   src={logoPreview || "/placeholder.svg"}
//                   alt="Logo"
//                   className="w-16 h-16 rounded-lg border"
//                 />
//                 {!readonly && (
//                   <Button
//                     type="button"
//                     variant="destructive"
//                     size="icon"
//                     className="absolute -top-2 -right-2 h-6 w-6"
//                     onClick={handleRemoveLogo}
//                   >
//                     <X className="h-3 w-3" />
//                   </Button>
//                 )}
//               </div>
//             ) : (
//               <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center">
//                 <Upload className="h-6 w-6 text-gray-400" />
//               </div>
//             )}
//             {!readonly && (
//               <div>
//                 <input
//                   id="logo"
//                   type="file"
//                   accept="image/*"
//                   onChange={handleLogoChange}
//                   className="hidden"
//                 />
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => document.getElementById("logo")?.click()}
//                 >
//                   {logoPreview ? "Cambiar Logo" : "Subir Logo"}
//                 </Button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Nombre */}
//         <div className="space-y-2">
//           <Label htmlFor="nombre">Nombre de la Empresa *</Label>
//           <Input
//             id="nombre"
//             value={datos.nombre}
//             onChange={(e) => handleInputChange("nombre", e.target.value)}
//             placeholder="Ingrese el nombre de la empresa"
//             disabled={readonly}
//           />
//         </div>

//         {/* Identificación */}
//         <div className="space-y-2">
//           <Label htmlFor="identificacion">Identificación *</Label>
//           <Input
//             id="identificacion"
//             value={datos.identificacion}
//             onChange={(e) =>
//               handleInputChange("identificacion", e.target.value)
//             }
//             placeholder="Ingrese la identificación"
//             disabled={readonly}
//           />
//         </div>

//         {/* Descripción */}
//         <div className="space-y-2">
//           <Label htmlFor="descripcion">Descripción</Label>
//           <Textarea
//             id="descripcion"
//             value={datos.descripcion}
//             onChange={(e) => handleInputChange("descripcion", e.target.value)}
//             placeholder="Ingrese una descripción de la empresa"
//             disabled={readonly}
//             rows={4}
//             className="resize-none"
//           />
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
