'use client';

import {FriendlyClient, FriendlyClientImpl} from '@/network/friendly-client';
import {useEffect} from 'react';

const client: FriendlyClient = new FriendlyClientImpl();

export default function Home() {
    const loadData = async () => {
        const auth = await client.generateAccount({
            nickname: 'boykisser',
            description: "I do like kissin' boys, btw desc.",
            interests: ['femboys'],
            avatar: null,
        });
        console.log(auth);
        client.setAuthToken(auth.token, auth.id.toString());
        const details = await client.getUserDetails();
        console.log(details);
    };

    useEffect(() => {
        void loadData();
    }, []);
    return <div className="p-4 text-1xl font-bold">Hello, world!</div>;
}
