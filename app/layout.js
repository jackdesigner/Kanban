import './globals.css';

export const metadata = {
  title: 'Design Kanban — Processo de Sistemas',
  description: 'Board de acompanhamento do processo de design de sistemas para totens.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
