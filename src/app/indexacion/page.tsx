import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Indexación de eventos y resultados", description: "Cómo Dorsalia publica información de eventos y resultados." };

export default function IndexacionPage() {
  return <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
    <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted)] mb-3">Transparencia</p>
    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Indexación de eventos y resultados</h1>
    <div className="mt-10 space-y-8 text-[var(--muted)] leading-relaxed text-sm md:text-[15px]">
      <section><h2 className="text-lg font-bold text-white">Un directorio informativo</h2><p className="mt-3">Dorsalia mantiene un directorio público de eventos y resultados con fines informativos, editoriales y periodísticos. La inclusión de una ficha no significa que Dorsalia organice el evento, represente a su organizador ni realice el cronometraje.</p></section>
      <section><h2 className="text-lg font-bold text-white">De dónde pueden venir los datos</h2><p className="mt-3">La información puede provenir de fuentes oficiales del evento, organizadores, proveedores de cronometraje, documentos y sitios públicos, participantes u otras fuentes que se indiquen cuando estén disponibles. Puede ser incompleta, contener errores o cambiar; consulta siempre la fuente oficial antes de tomar decisiones.</p></section>
      <section><h2 className="text-lg font-bold text-white">Resultados y trazabilidad</h2><p className="mt-3">Cuando se importan resultados, Dorsalia puede conservar la fila original de la fuente para trazabilidad y revisión. Un nombre completo puede ser localizable antes de que una persona reclame un resultado, y reclamarlo y publicarlo actualmente ocurren en el mismo flujo. Por ello no afirmamos que un resultado no reclamado sea completamente privado ni que exista un retiro autónomo posterior al reclamo.</p></section>
      <section><h2 className="text-lg font-bold text-white">Correcciones, revisión y reportes</h2><p className="mt-3">Si identificas información incorrecta, desactualizada, incompleta o que requiera revisión, escríbenos a <a className="text-white underline" href="mailto:contacto@dorsalia.run?subject=Solicitud%20de%20correcci%C3%B3n%20o%20revisi%C3%B3n">contacto@dorsalia.run</a> con la URL, la corrección solicitada y, si es posible, la fuente de respaldo. Evaluaremos el contexto y podremos corregir, actualizar, retirar o pedir información adicional.</p></section>
      <section><h2 className="text-lg font-bold text-white">Alcance legal</h2><p className="mt-3">Este aviso describe la operación del directorio y no limita derechos u obligaciones que la ley no permita limitar. Los fines informativos, editoriales o periodísticos no sustituyen las obligaciones legales aplicables.</p></section>
    </div>
    <p className="mt-12 text-sm text-[var(--muted)]">Consulta también <Link className="text-white underline" href="/privacidad">Privacidad</Link>, <Link className="text-white underline" href="/terminos">Términos</Link> y <Link className="text-white underline" href="/normas-comunidad">Normas de la comunidad</Link>.</p>
  </div>;
}
