import { SimulatorClient } from "@/components/simulador/simulator-client";
import { getChannels, getUnits } from "@/app/actions/catalog";

export const metadata = { title: "Simulador de Metas" };

export default async function SimuladorPage() {
  const [channels, units] = await Promise.all([getChannels(), getUnits()]);
  return <SimulatorClient channels={channels} units={units} />;
}
