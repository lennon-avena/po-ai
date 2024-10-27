import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const agrupadores = await prisma.agrupadorDePOM.findMany({
      include: {
        filhos: true,
        poms: true,
      },
    });
    return NextResponse.json(agrupadores || []); // Garante que sempre retorne um array
  } catch (error) {
    console.error('Erro ao buscar agrupadores:', error);
    return NextResponse.json({ error: 'Erro ao buscar agrupadores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nome } = await request.json();
    const novoAgrupador = await prisma.agrupadorDePOM.create({
      data: { nome },
      include: {
        filhos: true,
        poms: true,
      },
    });
    return NextResponse.json(novoAgrupador);
  } catch (error) {
    console.error('Erro ao criar agrupador:', error);
    return NextResponse.json({ error: 'Erro ao criar agrupador' }, { status: 500 });
  }
}
