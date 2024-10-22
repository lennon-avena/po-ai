import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Bem-vindo ao Sistema de Mapeamento POM</h1>
      <div className="flex space-x-4">
        <Link href="/pom">
          <Button className="text-lg">
            Ir para o Mapeamento POM
          </Button>
        </Link>
        <Link href="/pom-management">
          <Button className="text-lg">
            Gestão de POMs
          </Button>
        </Link>
      </div>
    </main>
  );
}
