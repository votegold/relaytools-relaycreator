import { getServerSession } from "next-auth/next"
import authOptions from "../../pages/api/auth/[...nextauth]"
import PaymentStatus from "./paymentStatus"
import PaymentSuccess from "./paymentSuccess"
import prisma from '../../lib/prisma'
import ZapAnimation from "../lightningsuccess/lightning"
import Balances from "./balances"

export const dynamic = 'force-dynamic';

export default async function ServerStatus(searchParams: Record<string, string>) {

    const session = await getServerSession(authOptions)

    const { relayname, pubkey, order_id } = searchParams;

    if (!relayname || !pubkey || !order_id) {
        if (session && (session as any).user.name) {
            // list the relays for the account
            let relays = await prisma.relay.findMany({
                where: {
                    status: "running",
                    owner: {
                        pubkey: (session as any).user.name
                    }
                },
                include: {
                    Order: true,
                    ClientOrder: true,
                    owner: true
                }
            })

            // list the invoices for the account
            let orders = await prisma.order.findMany({
                where: {
                    user: {
                        pubkey: (session as any).user.name
                    }
                },
                include: {
                    relay: true,
                }
            })

            // superadmin
            // find the superadmins,
            // compare them to the logged in user
            // if superadmin, then show ALL relay's balances and orders in a superadminy screen
            const admins = await prisma.user.findMany({where: {admin: true}})
            let isAdmin = false;
            for (let i = 0; i < admins.length; i++) {
                if (admins[i].pubkey == (session as any).user.name) {
                    isAdmin = true;
                }
            }

            if(isAdmin) {
                relays = await prisma.relay.findMany({
                    where: {
                        status: "running"
                    },
                    include: {
                        Order: true,
                        ClientOrder: true,
                        owner: true
                    }
                })

                orders = await prisma.order.findMany({
                    include: {
                        relay: true,
                    }
                })
            }

            // for each relay
            // add up all order amounts, and divide by amount of time to show remaining balance
            
            const paymentAmount = Number(process.env.INVOICE_AMOUNT)

            const relayBalances = relays.map(relay => {
                const totalAmount = relay.Order.reduce((sum, order) => {
                    if(order.paid) {
                        return sum + order.amount
                    } else {
                        return sum + 0
                    }
                }, 0)

                const clientOrderAmount = relay.ClientOrder.reduce((sum, order) => {
                    if(order.paid) {
                        return sum + order.amount
                    } else {
                        return sum + 0
                    }
                }, 0)

                const paidOrders = relay.Order.filter(order => order.paid_at !== null);

                const now: any = new Date().getTime();

                const firstOrderDate: any = new Date(Math.min(...paidOrders.map(order => (order.paid && order.paid_at) ? new Date(order.paid_at).getTime() : now.getTime())));

                const timeInDays: any = (now - firstOrderDate) / 1000 / 60 / 60 / 24;

                // cost per day, paymentAmount / 30
                const costPerDay = paymentAmount / 30;

                // Divide the total amount by the amount of time to get the balance
                const balance = (totalAmount + clientOrderAmount) - (timeInDays * costPerDay);

                return {
                    owner: relay.owner.pubkey,
                    clientPayments: clientOrderAmount,
                    relayName: relay.name,
                    relayId: relay.id,
                    balance: balance
                };
            })

            return (
                <div>
                    <Balances IsAdmin={isAdmin} RelayBalances={relayBalances}/>

                    <h1>Your Orders</h1>
                    <div className="mt-8 flow-root">
                        <div className="overflow-x-auto">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Relay Name</th>
                                        <th>Payment Status</th>
                                        <th>Paid at</th>
                                        <th>Expires At</th>
                                        <th>Amount (sats)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id + "rowkey"}>
                                            <td>{order.id}</td>
                                            <td>{order.relay.name}</td>
                                            <td>{order.paid ? "paid" : "un-paid"}</td>
                                            <td>{order.paid_at ? new Date(order.paid_at).toLocaleString() : ""}</td>
                                            <td>{order.expires_at ? new Date(order.expires_at).toLocaleString() : ""}</td>
                                            <td>{order.amount}</td>
                                            <td>
                                                {order.expires_at && order.expires_at > new Date() && !order.paid && 
                                                    <a className="btn btn-secondary" href={`/invoices?relayname=${order.relay.name}&pubkey=${pubkey}&order_id=${order.id}`}>show</a>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )
        }
    }
    // not logged in or no relayname/pubkey/order_id
    if(!order_id || !relayname) {
        return(
        <div className="flow-root">
            <h1>please login to view your invoices</h1>
        </div>
        )
    }

    let useRelayName = "wtf-bro";
    if (relayname) {
        useRelayName = relayname
    }

    let usePubkey = "";
    if (pubkey) {
        usePubkey = pubkey
    }

    const o = await prisma.order.findFirst({
        where: { id: order_id },
        include: {
            relay: true,
        }
    })

    if (o == null) {
        console.log("order not found")
        return
    }

    const paymentsEnabled = (process.env.PAYMENTS_ENABLED == "true")

    if (paymentsEnabled) {
        return (
            <div>
                <PaymentStatus amount={o.amount} payment_hash={o.payment_hash} payment_request={o.lnurl} />
                <PaymentSuccess signed_in={session && (session as any).user.name} relay_name={o.relay.name} relay_id={o.relay.id} payment_hash={o.payment_hash} payment_request={o.lnurl} />
            </div>
        )
    } else {
        return (
            <div>
                <ZapAnimation redirect_to={`/curator?relay_id=${o.relayId}`}></ZapAnimation>
            </div>
        )
    }
}