/**
 * Inicializa pdfmake + vfs_fonts (Roboto) uma vez por chamada.
 * Compatível com export ESM/CJS do pacote pdfmake.
 */
export async function loadPdfMake() {
  const pdfMakeMod = await import("pdfmake/build/pdfmake");
  const pdfFontsMod = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeMod.default ?? pdfMakeMod;
  const fontsBundle = pdfFontsMod.default ?? pdfFontsMod;
  const vfs = fontsBundle?.pdfMake?.vfs ?? fontsBundle;

  if (!vfs || typeof vfs !== "object") {
    throw new Error("Não foi possível carregar as fontes do PDF.");
  }

  pdfMake.vfs = vfs;
  return pdfMake;
}
