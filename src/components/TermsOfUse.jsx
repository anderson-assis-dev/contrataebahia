import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './LegalPage.css';
import { BRAND_NAME, BRAND_EMAIL } from '../utils/brand';

export default function TermsOfUse() {
  return (
    <div>
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <Link to="/" className="legal-back"><ArrowLeft size={15} /> Voltar ao início</Link>
          <h1>Termos de Uso</h1>
          <div className="legal-updated">Última atualização: 26 de agosto de 2026</div>
        </div>
      </section>

      <div className="legal-body">
        <div className="legal-alert">
          <strong>Leia com atenção antes de usar a plataforma.</strong>
          Ao criar uma conta ou utilizar o {BRAND_NAME}, você concorda integralmente com estes
          Termos de Uso. Se não concordar com qualquer disposição, não utilize a Plataforma.
        </div>

        <div className="legal-section">
          <h2><span>1.</span> Aceitação dos Termos</h2>
          <p>
            Ao criar uma conta, acessar ou utilizar o {BRAND_NAME} (&quot;Plataforma&quot;), você
            concorda integralmente com estes Termos de Uso. O uso continuado da Plataforma após a
            publicação de alterações constitui aceitação das modificações.
          </p>
        </div>

        <div className="legal-section">
          <h2><span>2.</span> Natureza da Plataforma — Intermediação Tecnológica</h2>
          <div className="legal-highlight">
            O {BRAND_NAME} é exclusivamente uma plataforma tecnológica de intermediação. Não somos
            parte do contrato de serviço celebrado entre cliente e prestador, não executamos
            serviços, não determinamos como serão executados e não garantimos qualidade, prazo ou
            resultado.
          </div>
          <p>
            O {BRAND_NAME} conecta clientes que precisam contratar serviços a prestadores
            qualificados. Nossa função é:
          </p>
          <ul>
            <li>Disponibilizar o ambiente tecnológico para que clientes e prestadores se encontrem;</li>
            <li>
              <strong>Sugerir</strong> prestadores e propostas com base em critérios objetivos — a
              decisão final de contratação é sempre e exclusivamente do cliente;
            </li>
            <li>Facilitar a comunicação entre as partes.</li>
          </ul>
          <p>
            <strong>Não determinamos, não garantimos e não supervisionamos</strong> a execução dos
            serviços contratados. Toda a negociação de escopo, prazo, forma de pagamento e condições
            de execução é acordada diretamente entre cliente e prestador, sendo de responsabilidade
            exclusiva das partes envolvidas.
          </p>
        </div>

        <div className="legal-section">
          <h2><span>3.</span> Cadastro e Conta</h2>
          <ul>
            <li>É necessário criar uma conta com informações verdadeiras, completas e atualizadas;</li>
            <li>Você é o único responsável por manter a confidencialidade de suas credenciais;</li>
            <li>Qualquer atividade realizada com suas credenciais é de sua inteira responsabilidade;</li>
            <li>
              Informações falsas, incompletas ou enganosas podem resultar em suspensão ou
              cancelamento permanente da conta;
            </li>
            <li>É permitida apenas uma conta por CPF/CNPJ.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>4.</span> Perfis de Usuário</h2>
          <ul>
            <li>
              <strong>Cliente:</strong> pessoa física ou jurídica que publica pedidos de serviço e
              recebe propostas de prestadores;
            </li>
            <li>
              <strong>Prestador:</strong> pessoa física ou jurídica que oferece serviços e envia
              propostas aos clientes.
            </li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>5.</span> Responsabilidades do Cliente</h2>
          <ul>
            <li>
              Descrever de forma clara e precisa o serviço desejado, incluindo requisitos,
              localização, prazo e orçamento estimado;
            </li>
            <li>Fornecer informações verdadeiras sobre o local de realização do serviço;</li>
            <li>Avaliar de forma justa e honesta os prestadores após a conclusão do serviço;</li>
            <li>
              O cliente é o único responsável pela escolha do prestador. O {BRAND_NAME} apenas
              apresenta opções — a contratação é decisão autônoma e exclusiva do cliente.
            </li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>6.</span> Responsabilidades do Prestador</h2>
          <ul>
            <li>Manter cadastro atualizado com informações verídicas sobre qualificações e serviços;</li>
            <li>
              Executar os serviços contratados com qualidade, pontualidade e em conformidade com a
              legislação vigente;
            </li>
            <li>Enviar propostas honestas e realizáveis dentro dos valores e prazos informados;</li>
            <li>
              O prestador é o <strong>único responsável pela legalidade, qualidade e consequências</strong>{' '}
              dos serviços prestados, incluindo obrigações trabalhistas, previdenciárias, fiscais e
              de segurança;
            </li>
            <li>
              O {BRAND_NAME} não se responsabiliza por danos, prejuízos, acidentes ou
              inadimplementos causados por prestadores.
            </li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>7.</span> Execução do Serviço e Pagamento entre as Partes</h2>
          <div className="legal-highlight">
            A execução do serviço e as condições de pagamento são acordadas exclusivamente entre
            cliente e prestador. O {BRAND_NAME} não é responsável por disputas, inadimplementos,
            danos materiais ou morais decorrentes da relação entre as partes.
          </div>
          <ul>
            <li>
              Escopo, prazo, preço, forma de pagamento e condições de execução são definidos
              livremente pelas partes, sem interferência do {BRAND_NAME};
            </li>
            <li>
              Eventuais disputas financeiras ou de qualidade devem ser resolvidas diretamente entre
              cliente e prestador, podendo o {BRAND_NAME} intermediar quando julgar conveniente, sem
              obrigação de resultado;
            </li>
            <li>O {BRAND_NAME} não retém, gerencia ou garante valores pagos entre as partes.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>8.</span> Propostas e Contratação</h2>
          <ul>
            <li>Prestadores enviam propostas para os pedidos publicados pelos clientes;</li>
            <li>A decisão final de contratação é sempre do cliente;</li>
            <li>
              Propostas aceitas constituem compromisso entre cliente e prestador, não envolvendo o
              {' '}{BRAND_NAME} como parte;
            </li>
            <li>O {BRAND_NAME} reserva-se o direito de remover propostas suspeitas ou fraudulentas.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>9.</span> Cobranças e Planos</h2>
          <ul>
            <li>O cadastro na Plataforma é gratuito;</li>
            <li>
              Prestadores podem ter acesso a planos opcionais para maior visibilidade e recursos
              adicionais;
            </li>
            <li>O cancelamento de plano não gera reembolso proporcional de valores já cobrados.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>10.</span> Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo da Plataforma — marca, logotipo, design, código-fonte e demais elementos
            — é de propriedade exclusiva do {BRAND_NAME} ou de seus licenciantes. É proibida
            qualquer reprodução, distribuição ou modificação não autorizada.
          </p>
        </div>

        <div className="legal-section">
          <h2><span>11.</span> Conduta Proibida</h2>
          <p>É expressamente proibido:</p>
          <ul>
            <li>Criar contas falsas ou usar identidades de terceiros;</li>
            <li>Enviar propostas fraudulentas ou com preços abusivos;</li>
            <li>Manipular os mecanismos de classificação da Plataforma;</li>
            <li>Realizar engenharia reversa ou acessar indevidamente os sistemas da Plataforma;</li>
            <li>Assediar, ameaçar ou ofender outros usuários;</li>
            <li>Publicar spam, propaganda não autorizada ou conteúdo malicioso.</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>12.</span> Limitação de Responsabilidade</h2>
          <div className="legal-highlight">
            O {BRAND_NAME} é uma plataforma de intermediação tecnológica. Não garantimos a
            qualidade, execução ou resultado dos serviços contratados entre usuários, nem a
            solvência ou idoneidade de qualquer das partes.
          </div>
          <ul>
            <li>Não garantimos disponibilidade ininterrupta ou livre de erros da Plataforma;</li>
            <li>
              Não somos responsáveis por danos diretos, indiretos, incidentais ou consequenciais
              decorrentes da relação entre cliente e prestador;
            </li>
            <li>
              Não nos responsabilizamos por acidentes, danos à propriedade, lesões corporais ou
              qualquer prejuízo ocorrido durante a execução do serviço;
            </li>
            <li>
              Nossa responsabilidade perante o usuário é limitada ao valor efetivamente pago pelo
              usuário ao {BRAND_NAME} nos últimos 12 meses.
            </li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>13.</span> Suspensão e Cancelamento</h2>
          <ul>
            <li>Podemos suspender ou cancelar contas que violem estes Termos, sem aviso prévio;</li>
            <li>Você pode cancelar sua conta a qualquer momento pelo suporte;</li>
            <li>
              Após o cancelamento, seus dados serão tratados conforme nossa Política de Privacidade.
            </li>
          </ul>
        </div>

        <div className="legal-section">
          <h2><span>14.</span> Proteção de Dados</h2>
          <p>
            O tratamento dos seus dados pessoais é regido pela nossa{' '}
            <Link to="/privacidade">Política de Privacidade</Link>, em conformidade com a LGPD
            (Lei nº 13.709/2018).
          </p>
        </div>

        <div className="legal-section">
          <h2><span>15.</span> Legislação Aplicável e Foro</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
            foro da comarca de Salvador, Estado da Bahia, com renúncia a qualquer outro, por mais
            privilegiado que seja.
          </p>
        </div>

        <div className="legal-contact">
          <h3>Contato</h3>
          <p>Em caso de dúvidas relacionadas a estes Termos:</p>
          <p><strong>E-mail:</strong> <a href={`mailto:${BRAND_EMAIL}`}>{BRAND_EMAIL}</a></p>
        </div>
      </div>
    </div>
  );
}
