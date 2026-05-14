import {FileWarning} from 'lucide-react';
import Link from 'next/link';

import {Button} from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function NotFound() {
    return (
        <div className="flex h-full w-full items-center justify-center p-4 bg-zinc-50 dark:bg-black">
            <Card className="w-full max-w-md text-center bg-white dark:bg-zinc-950">
                <CardHeader className="items-center">
                    <div className="mb-2 flex size-12 items-center justify-center rounded-full border">
                        <FileWarning className="size-6" />
                    </div>
                    <CardTitle className="text-3xl">404</CardTitle>
                    <CardDescription className="text-white/80">
                        This page is not the web page you are looking for.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/">Go back</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
