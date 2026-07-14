import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { FileText, Building2, Globe, CreditCard, Lock, Scale, RefreshCw, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/termos-condicoes")({
  head: () => ({
    meta: [
      { title: "Termos & Condições — F&M Construções Inteligentes" },
      { name: "description", content: "Termos e condições de uso do site e serviços da F&M Construções Inteligentes, incluindo termos de pagamento via Paddle." },
      { property: "og:title", content: "Termos & Condições — F&M Construções Inteligentes" },
      { property: "og:description", content: "Termos e condições de uso do site e serviços da F&M Construções Inteligentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermosCondicoesPage,
});

const SECTIONS = [
  { id: "sobre", label: "Sobre F&M Construções" },
  { id: "uso", label: "Uso do Site" },
  { id: "servicos", label: "Serviços Oferecidos" },
  { id: "pagamento", label: "Termos de Pagamento — Paddle" },
  { id: "propriedade", label: "Propriedade Intelectual" },
  { id: "responsabilidade", label: "Limitação de Responsabilidade" },
  { id: "modificacoes", label: "Modificações dos Termos" },
  { id: "contato", label: "Contato" },
];

function TermosCondicoesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold text-sm">F&M</div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-primary">F&M Construções</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Inteligentes</div>
            </div>
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-primary hover:text-primary/80 transition"
          >
            Voltar para o início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
            Termos & Condições
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            F&M Construções Inteligentes — Inovação • Qualidade • Sustentabilidade
          </p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 lg:p-8 shadow-sm mb-12">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-primary/10 text-primary grid place-items-center text-xs">§</span>
            Índice
          </h2>
          <nav className="grid sm:grid-cols-2 gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-primary/5 hover:text-primary transition"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>

        <article className="prose prose-slate max-w-none">
          <section id="sobre" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">1. Sobre F&M Construções Inteligentes</h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>
                A F&M Construções Inteligentes (CNPJ: 21.560.948/0001-71) é uma empresa especializada em soluções de construção inovadora, localizada em Jauá, Camaçari/BA, Brasil. Operamos com o sistema Inovabloco® (IBPP), um sistema patenteado de painéis pré-moldados de última geração.
              </p>
              <p>
                Este documento estabelece os termos e condições que regem o uso do site fmsmartbuild.com.br e a relação comercial com nossos clientes.
              </p>
            </div>
          </section>

          <section id="uso" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">2. Uso do Site</h2>
            </div>
            <div className="space-y-6 text-foreground/80 leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2.1 Aceitação dos Termos</h3>
                <p>
                  Ao acessar e usar o site fmsmartbuild.com.br, você concorda em estar vinculado por estes Termos & Condições. Se você não concorda com qualquer parte destes termos, por favor, não use o site.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2.2 Uso Permitido</h3>
                <p>
                  Você concorda em usar este site apenas para fins legais e de maneira que não viole direitos de terceiros ou restrinja seu uso. Comportamento proibido inclui:
                </p>
                <ul className="mt-3 space-y-2 list-disc pl-5">
                  <li>Assediar ou causar constrangimento a qualquer pessoa</li>
                  <li>Obscurecer identificação de origem de conteúdo transmitido através do site</li>
                  <li>Causar interrupção de fluxo normal de diálogo dentro de nosso website</li>
                  <li>Cometer ofensas relacionadas a qualquer aspecto de moralidade ou decência</li>
                  <li>Violar patentes, marcas registradas, segredos comerciais ou direitos autorais</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2.3 Isenção de Responsabilidade</h3>
                <p>
                  O site é fornecido "como está", sem qualquer representação ou garantia. Não garantimos que o site atenderá às suas necessidades ou que seu funcionamento será ininterrupto ou livre de erros.
                </p>
              </div>
            </div>
          </section>

          <section id="servicos" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">3. Serviços Oferecidos</h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>F&M Construções oferece:</p>
              <ul className="space-y-2 list-disc pl-5">
                <li>Consultoria em projetos de construção com sistema Inovabloco (IBPP)</li>
                <li>Orçamentos e propostas personalizadas</li>
                <li>Execução de obras com sistema IBPP</li>
                <li>Suporte técnico e pós-obra de 5 anos de garantia</li>
                <li>Venda de materiais de construção (através da loja em fmsmartbuild.com.br/loja)</li>
              </ul>
              <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 mt-4">
                <p className="text-sm text-foreground/80">
                  <strong>Nota:</strong> Todos os orçamentos e propostas são estimativas e podem estar sujeitos a ajustes conforme o projeto se desenvolve. Você será informado de qualquer mudança significativa antes de sua implementação.
                </p>
              </div>
            </div>
          </section>

          <section id="pagamento" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">4. Termos e Condições de Pagamento — Paddle</h2>
            </div>
            <div className="space-y-6 text-foreground/80 leading-relaxed">
              <p>
                Os pagamentos processados através da plataforma Paddle seguem os termos e condições específicos da Paddle. É essencial que você compreenda esses termos antes de realizar qualquer transação.
              </p>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">4.1 Termos Aplicáveis por Tipo de Cliente</h3>
                <div className="grid sm:grid-cols-2 gap-4 mt-3">
                  <div className="rounded-xl border border-border bg-secondary p-4">
                    <p className="font-semibold text-foreground mb-2">Para Clientes Empresariais (B2B):</p>
                    <a
                      href="https://www.paddle.com/legal/invoiced-business-terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Paddle Invoiced Business Terms
                    </a>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary p-4">
                    <p className="font-semibold text-foreground mb-2">Para Clientes Consumidores (B2C):</p>
                    <a
                      href="https://www.paddle.com/legal/invoiced-consumer-terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Paddle Invoiced Consumer Terms
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">4.2 Aceitação dos Termos na Primeira Fatura</h3>
                <div className="rounded-xl border-l-4 border-destructive bg-destructive/5 p-4">
                  <p className="font-semibold text-foreground mb-2">⚠️ Atenção:</p>
                  <p className="mb-2">
                    Quando você receber a sua primeira fatura da Paddle, será solicitado que aceite os Termos e Condições da Paddle como reseller de nossos produtos. Este é um processo simples e automático que aparecerá como um popup quando você visualizar a fatura.
                  </p>
                  <p>
                    <strong>Aceitação única:</strong> A aceitação é necessária apenas uma vez. Você não precisará aceitar novamente em faturas subsequentes.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">4.3 Status da Fatura</h3>
                <p>O status de sua fatura será exibido como:</p>
                <ul className="mt-3 space-y-2 list-disc pl-5">
                  <li>"Pendente" (Paddle Classic) — enquanto aguarda o processamento</li>
                  <li>"Não paga" (Paddle Billing) — durante a aceitação dos termos e processamento inicial</li>
                </ul>
                <p className="mt-3">
                  Este é um comportamento normal. A fatura será atualizada assim que o processamento for concluído.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">4.4 Informações Importantes sobre Paddle</h3>
                <ul className="space-y-2 list-disc pl-5">
                  <li><strong>Segurança:</strong> Todos os dados de pagamento são processados de forma segura e criptografada pela Paddle</li>
                  <li><strong>Conformidade legal:</strong> Paddle é responsável por garantir conformidade com leis de pagamento aplicáveis</li>
                  <li><strong>Suporte Paddle:</strong> Para dúvidas sobre processamento de pagamentos, visite <a href="https://www.paddle.com/support" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Paddle Support</a></li>
                </ul>
              </div>
            </div>
          </section>

          <section id="propriedade" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">5. Propriedade Intelectual</h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>
                Todo conteúdo do site fmsmartbuild.com.br, incluindo textos, gráficos, logos, imagens e software, é propriedade de F&M Construções Inteligentes ou de seus fornecedores de conteúdo e é protegido por leis internacionais de direitos autorais.
              </p>
              <p>
                A marca Inovabloco® e o sistema IBPP (Inovabloco Paredes Prontas) são propriedades intelectuais protegidas pela INPI (Instituto Nacional da Propriedade Industrial — BR 20 2024 012110 0).
              </p>
              <p>
                Você pode visualizar e imprimir páginas do site para seu uso pessoal, não comercial. Qualquer outro uso de conteúdo sem permissão escrita é proibido.
              </p>
            </div>
          </section>

          <section id="responsabilidade" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">6. Limitação de Responsabilidade</h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>
                Na máxima extensão permitida pela lei, F&M Construções não será responsável por quaisquer danos indiretos, incidentais, especiais, consequentes ou punitivos resultantes do uso ou da impossibilidade de usar o site ou seus serviços.
              </p>
              <p>
                Qualquer garantia de produto é limitada ao período especificado em nossos contratos comerciais (padrão de 5 anos para obras com sistema IBPP).
              </p>
            </div>
          </section>

          <section id="modificacoes" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">7. Modificações dos Termos</h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>
                F&M Construções Inteligentes reserva-se o direito de modificar estes Termos & Condições a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação no site. Seu uso continuado do site após quaisquer modificações significa sua aceitação dos novos termos.
              </p>
              <p>
                Recomendamos que você revise estes termos periodicamente para estar ciente de qualquer mudança.
              </p>
            </div>
          </section>

          <section id="contato" className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-primary">8. Contato</h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>
                Se você tiver dúvidas sobre estes Termos & Condições, entre em contato conosco:
              </p>
              <ul className="space-y-3 mt-4">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email:{" "}
                  <a href="mailto:helder@fmconstrucoes.com.br" className="text-primary hover:underline font-medium">
                    helder@fmconstrucoes.com.br
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  WhatsApp: (71) 99945-4343
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Endereço: Rua Alameda Via Parque, 09 — Jauá, Camaçari/BA, Brasil
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  CNPJ: 21.560.948/0001-71
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Website: fmsmartbuild.com.br
                </li>
              </ul>
            </div>
          </section>
        </article>
      </main>

      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-md bg-accent text-accent-foreground grid place-items-center font-bold">F&M</div>
            <div>
              <div className="font-bold">F&M Construções Inteligentes</div>
              <div className="text-xs text-white/70 uppercase tracking-widest">Inovação • Qualidade • Sustentabilidade</div>
            </div>
          </div>
          <p className="text-white/60 text-sm">
            © 2024 F&M Construções Inteligentes. Todos os direitos reservados.
          </p>
          <p className="text-white/50 text-xs mt-2">
            Última atualização: Julho de 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
