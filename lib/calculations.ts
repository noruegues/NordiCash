import type { Investimento, Consorcio, Bem } from "./store";

export function projecaoInvestimento(inv: Investimento, taxaMensal: number, meses: number) {
  // Retorna 3 séries: saldo projetado, aporte acumulado, rendimento acumulado
  const data: { mes: number; saldo: number; aporteAcum: number; rendimentoAcum: number; valor: number }[] = [];
  const saldoBase = inv.saldoAtual;
  let saldo = saldoBase;
  let aporteAcum = 0;
  for (let m = 0; m <= meses; m++) {
    if (m > 0) {
      saldo = (saldo + inv.aporteMensal) * (1 + taxaMensal);
      aporteAcum += inv.aporteMensal;
    }
    const rendimentoAcum = saldo - saldoBase - aporteAcum;
    data.push({
      mes: m,
      saldo: Math.round(saldo),
      aporteAcum: Math.round(saldoBase + aporteAcum),
      rendimentoAcum: Math.round(rendimentoAcum),
      valor: Math.round(saldo),
    });
  }
  return data;
}

export function projecaoPortfolio(invs: Investimento[], taxaMensal: number, meses: number) {
  // Retorna 3 séries: saldo projetado, aporte acumulado, rendimento acumulado
  const data: { mes: number; saldo: number; aporteAcum: number; rendimentoAcum: number; valor: number }[] = [];
  const saldoBase = invs.reduce((s, i) => s + i.saldoAtual, 0);
  const aporteMensal = invs.reduce((s, i) => s + i.aporteMensal, 0);

  let saldo = saldoBase;
  let aporteAcum = 0;
  for (let m = 0; m <= meses; m++) {
    if (m > 0) {
      saldo = (saldo + aporteMensal) * (1 + taxaMensal);
      aporteAcum += aporteMensal;
    }
    const rendimentoAcum = saldo - saldoBase - aporteAcum;
    data.push({
      mes: m,
      saldo: Math.round(saldo),
      aporteAcum: Math.round(saldoBase + aporteAcum),
      rendimentoAcum: Math.round(rendimentoAcum),
      valor: Math.round(saldo), // legado
    });
  }
  return data;
}

export function depreciacao(b: Bem) {
  const total = Math.max(0, b.valorCompra - b.valorMercado);
  const anual = b.anosUso > 0 ? total / b.anosUso : 0;
  return { anual, acumulada: total, liquido: b.valorMercado - b.dividaRestante };
}

// Para cada parcela (índice 0..n-1), calcula o valor da "parcela cheia simulada"
// caso fosse contemplado naquele momento: saldoDevedor no início da parcela / parcelas restantes.
// Parcelas já pagas consomem o saldo pelo valor efetivamente pago; parcelas futuras
// projetam o consumo pelo valor atualmente registrado (reduzido ou recalculado).
export function simularCheiaConsorcio(c: Consorcio): number[] {
  const totalDevido = c.valorCarta * (1 + c.taxaAdmin / 100);
  let saldoRestante = totalDevido;
  const out: number[] = [];
  for (let i = 0; i < c.parcelas.length; i++) {
    const restantes = c.parcelas.length - i;
    out[i] = restantes > 0 ? Math.max(0, saldoRestante / restantes) : 0;
    saldoRestante -= c.parcelas[i].valor;
  }
  return out;
}

export function consorcioStats(c: Consorcio) {
  const pagas = c.parcelas.filter((p) => p.status === "Pago").length;
  const totalPago = c.parcelas.filter((p) => p.status === "Pago").reduce((s, p) => s + p.valor, 0);
  const restantes = c.prazoMeses - pagas;
  const pct = (pagas / c.prazoMeses) * 100;
  const totalDevido = c.valorCarta * (1 + c.taxaAdmin / 100);
  const saldoDevedor = Math.max(0, totalDevido - totalPago);

  // Próxima parcela a pagar (Pendente ou Futuro mais próximo)
  const proximaIdx = c.parcelas.findIndex((p) => p.status !== "Pago");
  const proxima = proximaIdx >= 0 ? c.parcelas[proximaIdx] : undefined;

  // Parcela cheia simulada = saldoDevedor atual / parcelas restantes (próxima e em diante)
  // Essa é a previsão do que o usuário pagaria de parcela cheia caso fosse contemplado
  // AGORA. Ela sobe a cada parcela reduzida paga porque o saldo devedor consumido é menor.
  const cheias = simularCheiaConsorcio(c);
  const parcelaCheiaSimulada = proximaIdx >= 0 ? cheias[proximaIdx] : 0;

  // Valor efetivamente cobrado no mês (reduzido ou valor recalculado pós-contemplação)
  const parcelaAtual = proxima?.valor ?? 0;

  // Retrocompat: parcelaCheiaEquivalente = cheia simulada
  const parcelaCheiaEquivalente = parcelaCheiaSimulada;

  return { pagas, totalPago, restantes, pct, saldoDevedor, totalDevido, parcelaAtual, parcelaCheiaEquivalente, parcelaCheiaSimulada, proxima, cheias };
}
