import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { paiId } = await request.json();
    const atualizadoAgrupador = await prisma.agrupadorDePOM.update({
      where: { id: params.id },
      data: { paiId },
      include: {
        filhos: true,
        poms: true,
        pai: true
      }
    });
    return NextResponse.json(atualizadoAgrupador);
  } catch (error) {
    console.error('Erro ao atualizar agrupador:', error);
    return NextResponse.json({ error: 'Erro ao atualizar agrupador' }, { status: 500 });
  }
}
