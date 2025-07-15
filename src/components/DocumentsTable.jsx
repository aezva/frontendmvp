import React, { useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import { Eye, Edit, Download, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

const DocumentsTable = ({ documents, loading, onView, onEdit, onDownload, onDelete }) => {
  const data = useMemo(() => documents || [], [documents]);
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: () => <span className="text-base font-light text-black">Nombre</span>,
      cell: info => (
        <div className="font-medium text-black truncate">{info.getValue()}</div>
      ),
    },
    {
      accessorKey: 'file_type',
      header: () => <span className="text-base font-light text-black pl-1">Tipo</span>,
      cell: info => (
        <div className="text-sm text-gray-500">{info.getValue() || 'Texto'}</div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: () => <span className="text-base font-light text-black pl-3">Fecha</span>,
      cell: info => (
        <div className="text-sm text-gray-500">{new Date(info.getValue()).toLocaleString()}</div>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="text-base font-light text-black pl-6">Acciones</span>,
      cell: ({ row }) => (
        <div className="flex gap-2 ml-4">
          <Button size="icon" variant="ghost" title="Ver" onClick={() => onView(row.original.id)} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
            <Eye className="h-4 w-4 text-[#ff9c9c]" />
          </Button>
          <Button size="icon" variant="ghost" title="Editar" onClick={() => onEdit(row.original.id)} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
            <Edit className="h-4 w-4 text-[#ff9c9c]" />
          </Button>
          <Button size="icon" variant="ghost" title="Descargar" onClick={() => onDownload(row.original.file_url)} disabled={!row.original.file_url} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
            <Download className="h-4 w-4 text-[#ff9c9c]" />
          </Button>
          <Button size="icon" variant="ghost" title="Eliminar" onClick={() => onDelete && onDelete(row.original.id)} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
            <Trash2 className="h-4 w-4 text-[#ff9c9c]" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ], [onView, onEdit, onDownload, onDelete]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: 'created_at', desc: true }] },
  });

  return (
    <div className="relative flex-1 min-h-0 h-full overflow-y-auto">
      {/* Encabezado de columnas */}
      <div className="grid grid-cols-4 w-full h-12 min-h-[48px] items-center px-4">
        {table.getHeaderGroups().map(headerGroup =>
          headerGroup.headers.map(header => (
            <div key={header.id} className="flex items-center select-none cursor-pointer" onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}>
              {flexRender(header.column.columnDef.header, header.getContext())}
              {header.column.getCanSort() && (
                <span className="ml-1 text-xs">
                  {header.column.getIsSorted() === 'asc' ? '▲' : header.column.getIsSorted() === 'desc' ? '▼' : ''}
                </span>
              )}
            </div>
          ))
        )}
      </div>
      <div className="absolute left-0 right-0 bottom-0 h-px w-full bg-border" />
      {/* Líneas divisorias verticales */}
      <div className="absolute top-0 left-1/4 bottom-0 w-px z-20 bg-border" />
      <div className="absolute top-0 left-1/2 bottom-0 w-px z-20 bg-border" />
      <div className="absolute top-0 left-3/4 bottom-0 w-px z-20 bg-border" />
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No hay documentos.</div>
        ) : (
          <div className="space-y-3">
            {table.getRowModel().rows.map(row => (
              <div key={row.id} className="flex items-center bg-white rounded-lg border px-6 py-4 shadow-sm group">
                {row.getVisibleCells().map(cell => (
                  <div key={cell.id} className="flex-1 min-w-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsTable; 