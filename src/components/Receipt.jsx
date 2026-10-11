import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BadgeCheck, ShieldCheck, Printer, Loader2, SearchX, MapPin, CalendarCheck,
} from 'lucide-react';
import './Receipt.css';
import { apiGet } from '../utils/api';
import { LOGO_SRC, BRAND_NAME } from '../utils/brand';

const dataHora = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const moeda = (v) => (v == null ? null : Number(v).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
}));

function Linha({ rotulo, valor }) {
  if (!valor) return null;
  return (
    <div className="rc-linha">
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

export default function Receipt() {
  const { codigo } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      try {
        const data = await apiGet(`/api/receipts/${encodeURIComponent(codigo)}`);
        if (!ativo) return;
        if (data) setDados(data);
        else setErro('Não encontramos nenhum comprovante com esse código.');
      } catch {
        if (ativo) setErro('Não foi possível consultar o comprovante agora.');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [codigo]);

  if (carregando) {
    return (
      <div className="rc-page rc-center">
        <Loader2 className="rc-spin" size={28} />
        <p>Conferindo o comprovante...</p>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="rc-page rc-center">
        <SearchX size={34} />
        <h1 className="rc-vazio-titulo">Comprovante não encontrado</h1>
        <p>{erro}</p>
        <p className="rc-vazio-codigo">Código consultado: {codigo}</p>
        <Link to="/" className="btn-outline">Ir para o início</Link>
      </div>
    );
  }

  const { servico, cliente, profissional, datas } = dados;

  return (
    <div className="rc-page">
      <div className="rc-folha">
        <header className="rc-head">
          <img src={LOGO_SRC} alt={BRAND_NAME} className="rc-logo" />
          <div className="rc-head-meta">
            <span className="rc-head-tipo">Comprovante de serviço</span>
            <strong className="rc-codigo">{dados.codigo}</strong>
          </div>
        </header>

        <h1 className="rc-titulo">{servico.titulo}</h1>
        <p className="rc-categoria">{servico.categoria}</p>

        {dados.chegada_validada_por_gps && (
          <div className="rc-selo-chegada">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>
              Chegada do profissional confirmada no local em{' '}
              <strong>{dataHora(datas.chegada_confirmada_em)}</strong>
              {dados.distancia_na_confirmacao_km != null && (
                <>, a {String(dados.distancia_na_confirmacao_km).replace('.', ',')} km do endereço</>
              )}
            </span>
          </div>
        )}

        <dl className="rc-bloco">
          <Linha rotulo="Contratante" valor={cliente.nome} />
          <Linha
            rotulo="Profissional"
            valor={profissional.nome && (
              <span className="rc-prof">
                {profissional.nome}
                {profissional.verificado && (
                  <span className="rc-verificado">
                    <BadgeCheck size={13} strokeWidth={2.4} aria-hidden="true" />
                    Verificado
                  </span>
                )}
              </span>
            )}
          />
          <Linha rotulo="Local" valor={dados.local && (
            <span className="rc-local"><MapPin size={13} aria-hidden="true" />{dados.local}</span>
          )} />
          <Linha rotulo="Valor acordado" valor={moeda(dados.valor)} />
          <Linha rotulo="Prazo acordado" valor={dados.prazo_dias ? `${dados.prazo_dias} dias` : null} />
        </dl>

        <dl className="rc-bloco">
          <Linha rotulo="Pedido publicado em" valor={dataHora(datas.pedido_em)} />
          <Linha rotulo="Agendado para" valor={dataHora(datas.agendado_para)} />
          <Linha rotulo="Concluído em" valor={dataHora(datas.concluido_em)} />
        </dl>

        {servico.descricao && (
          <div className="rc-descricao">
            <span className="rc-descricao-rotulo">Descrição do serviço</span>
            <p>{servico.descricao}</p>
          </div>
        )}

        <footer className="rc-rodape">
          <CalendarCheck size={14} aria-hidden="true" />
          <span>
            Emitido em {dataHora(dados.emitido_em)} por {BRAND_NAME}. Confira a
            autenticidade em contrataebahia.com.br/comprovante/{dados.codigo}
          </span>
        </footer>
      </div>

      <div className="rc-acoes">
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          <Printer size={16} />
          Salvar em PDF ou imprimir
        </button>
        <Link to="/" className="btn-outline">Ir para o início</Link>
      </div>
    </div>
  );
}
