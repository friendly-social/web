'use client';

import {
    FriendlyClient,
    FriendlyClientImpl,
    UserDetailsResponse,
} from '@/network/friendly-client';
import {useEffect, useState} from 'react';
import {
    Alert,
    AppBar,
    Avatar,
    Button,
    Chip,
    IconButton,
    Toolbar,
    Typography,
} from '@mui/material';
import {CheckIcon, MenuIcon} from 'lucide-react';

const client: FriendlyClient = new FriendlyClientImpl();

export default function Home() {
    const [userDetails, setUserDetails] = useState<UserDetailsResponse | null>(
        null,
    );
    const [isShowAlert, setIsShowAlert] = useState(false);

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
        setIsShowAlert(true);
    };

    useEffect(() => {
        void loadData();
    }, []);
    return (
        <div className="flex flex-col">
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{mr: 2}}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                        Friendly
                    </Typography>
                    <Button color="inherit">Log out</Button>
                </Toolbar>
            </AppBar>
            <Alert
                hidden={!isShowAlert}
                icon={<CheckIcon fontSize="inherit" />}
                severity="success"
                onClose={() => {
                    setIsShowAlert(false);
                }}
            >
                New account successfully registered.
            </Alert>
            <>
                <div
                    className="flex flex-col gap-2 p-2 items-center pt-8"
                    hidden={userDetails === null}
                >
                    <Avatar>{userDetails?.nickname.toString()[0]}</Avatar>
                    <p>{userDetails?.nickname}</p>
                    <p>{userDetails?.description}</p>
                    <h3>Interests:</h3>
                    <div className="flex flex-row gap-2">
                        {userDetails?.interests.map(interest => (
                            <Chip label={interest} key={interest} />
                        ))}
                    </div>
                </div>
            </>
        </div>
    );
}
