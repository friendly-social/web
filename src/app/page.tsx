'use client';

import {
    FriendlyClient,
    FriendlyClientImpl,
    UserDetailsResponse,
} from '@/network/friendly-client';
import {useEffect, useState} from 'react';

const client: FriendlyClient = new FriendlyClientImpl();

export default function Home() {
    const [userDetails, setUserDetails] = useState<UserDetailsResponse | null>(
        null,
    );
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
        setUserDetails(details);
    };

    useEffect(() => {
        void loadData();
    }, []);
    return (
        <div className="p-2 flex flex-col">
            <div className="flex flex-col gap-2" hidden={userDetails === null}>
                <div className="flex justify-center items-center rounded-full bg-primary w-12 h-12 text-2xl font-bold uppercase tracking-wide text-primary-foreground">
                    {userDetails?.nickname.toString()[0]}
                </div>
                <p>{userDetails?.nickname}</p>
                <p>{userDetails?.description}</p>
                <h3>Interests:</h3>
                {userDetails?.interests.map(interest => (
                    <p
                        key={interest}
                        className="w-min px-1 py-0 rounded-3xl bg-primary text-base text-primary-foreground hover:bg-primary/70 cursor-pointer"
                    >
                        {interest}
                    </p>
                ))}
            </div>
        </div>
    );
}
