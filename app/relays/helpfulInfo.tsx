"use client"
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IoArrowForwardOutline } from 'react-icons/io5';

export default function HelpfulInfo(props: React.PropsWithChildren<{}>) {
    const { data: session, status } = useSession();
    const p = useSearchParams();
    if (p == null) {
        return (
            <>
                no p
            </>
        )
    }

    const relayname = p.get('relayname');
    let useName = ""
    if (relayname) {
        useName = relayname
    }

    const router = useRouter()

    const handleCreateRelay = async (event: any) => {
        event.preventDefault();

    }

    return (
        <div className="font-jetbrains">
            <h1 className="text-3xl text-primary text-center">Being part of the decentralized social internet means
your privacy and freedom are guaranteed.</h1>
            <div className="mt-2 lg:grid lg:grid-cols-3 lg:gap-2 sm:flex sm:flex-col sm:gap-4">
                <div className="card w-96 bg-base-100 hidden lg:block">
                    <div className="card-body">
                        <h2 className="card-title">Chapters</h2>
                        <p>Collect donations. Publish events. Manage private group discussions.</p>
                    </div>
                </div>
                <div className="card w-96 bg-base-100 hidden lg:block">
                    <div className="card-body">
                        <h2 className="card-title">Candidates</h2>
                        <p>
                        Connect publicly with followers across multiple social platforms.
                        </p>
                    </div>
                </div>
                <div className="card w-96 bg-base-100">
                    <div className="card-body">
                        <h2 className="card-title">Volunteers</h2>
                        <p>Discuss issues and plan actions at the local, regional, and national levels.</p>
                    </div>
                </div>
            </div>
            <div className="mt-2 flex rounded-md w-full items-center">
                <span className="w-full bg-gradient-to-r from-gray-200 to-gray-100 items-center h-5 px-3 sm:text-sm">
                </span>
                <a href={`/signup`} className="btn btn-primary inline-flex text-center rounded-md border border-l-0 border-gray-300 px-3 sm:text-sm"
                >
                    Create a relay<span className="fl pl-2"><IoArrowForwardOutline /></span>
                </a>
            </div>
        </div >
    )
}