import { notFound } from "next/navigation";
import { requireCurrentTenantPermission } from "@/lib/authorization/authorization-service";
import { getDatabaseClient } from "@/lib/database/database";
import { AssuranceOrderService } from "@/lib/assurance/assurance-order-service";
import { AssuranceOrderWorkspace } from "@/components/company/assurance-order-workspace";

export default async function AssuranceOrderDetailPage({params}:{params:Promise<{orderId:string}>}):Promise<React.JSX.Element>{ const {orderId}=await params; const principal=await requireCurrentTenantPermission("company.orders.read"); const service=new AssuranceOrderService(await getDatabaseClient()); const order=await service.findOrder(principal,orderId); if(!order) notFound(); const cases=await service.listCases(principal,orderId); return <section className="page-stack"><div className="page-heading"><div><p className="eyebrow">Company assurance</p><h1>Assurance order</h1><p>{order.orderReference} · {order.orderStatus}</p></div></div><AssuranceOrderWorkspace order={order} cases={cases}/><section aria-labelledby="action-centre-summary"><h2 id="action-centre-summary">Action Centre</h2><p>Every pending case shows its current owner and exact next action. Use the Company Action Centre for safe internal commands.</p></section></section>; }
