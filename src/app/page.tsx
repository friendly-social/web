'use client';

import {
    FriendlyClient,
    FriendlyClientImpl,
    UserDetailsResponse,
} from '@/network/friendly-client';
import {useEffect, useState} from 'react';
import {Badge} from '@/components/base/badges/badges';
import {Avatar} from '@/components/base/avatar/avatar';
import {QRCode} from '@/components/shared-assets/qr-code';

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
        <div className="flex flex-col">
            <>
                <div
                    className="flex flex-col gap-2 p-2 items-center pt-8"
                    hidden={userDetails === null}
                >
                    <Avatar
                        size="md"
                        initials={userDetails?.nickname
                            .toString()[0]
                            .toUpperCase()}
                        alt={userDetails?.nickname.toString()}
                    />
                    <p>{userDetails?.nickname}</p>
                    <p>{userDetails?.description}</p>
                    <h3>Interests:</h3>
                    <div className="flex flex-row gap-2">
                        {userDetails?.interests.map(interest => (
                            <Badge
                                type="pill-color"
                                color="brand"
                                size="sm"
                                key={interest}
                            >
                                {interest}
                            </Badge>
                        ))}
                    </div>
                    <QRCode value="https://github.com/kotleni" size="lg" />
                </div>
            </>
        </div>
    );
}
