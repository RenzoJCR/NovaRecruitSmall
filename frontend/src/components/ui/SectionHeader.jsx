import React from "react";

function SectionHeader({ title, description }) {
  return (
    <div className="border-b border-slate-100 pb-5 mb-6">
      <div className="flex flex-col gap-1">
        {/* Título de impacto con tipografía gruesa y tracking cerrado */}
        <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
          {title}
        </h1>
        
        {/* Descripción secundaria en gris elegante para dar contexto */}
        {description && (
          <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default SectionHeader;