import {Button} from '@/components/ui/button';
import {FeedItem} from '@/network/friendly-client';
import {Check, Heart, X} from 'lucide-react';
import {FeedDialog, SwipeDirection} from '@/app/feed/feed-dialog';
import {cn} from '@/lib/utils';

interface FeedCardProps {
    selectedCard: FeedItem;
    loading: boolean;
    handleReview: (direction: SwipeDirection) => void;
}

export function FeedCard({selectedCard, loading, handleReview}: FeedCardProps) {
    return (
        <div className={cn('w-full h-full flex flex-row justify-center')}>
            <div
                className={cn(
                    'h-full w-full sm:w-fit flex overflow-y-auto scrollbar-none sm:py-4',
                )}
            >
                <div
                    className={cn(
                        'my-auto',
                        'w-full shrink-0 sm:w-90 md:w-100',
                        'sm:rounded-2xl sm:border sm:border-border bg-card',
                    )}
                >
                    <FeedDialog
                        selectedCard={selectedCard}
                        loading={loading}
                        handleReview={handleReview}
                    />
                </div>
            </div>
            <div className="sm:flex flex-col hidden ms-4 self-center gap-2">
                <Button
                    className="h-15 w-15 cursor-pointer rounded-full"
                    disabled={loading}
                    onClick={() => handleReview('right')}
                >
                    {selectedCard.isRequest ? (
                        <Check className="h-8 w-8" />
                    ) : (
                        <Heart className="h-8 w-8" />
                    )}
                </Button>
                <Button
                    variant="outline"
                    className="h-15 w-15 cursor-pointer rounded-full"
                    disabled={loading}
                    onClick={() => handleReview('left')}
                >
                    <X className="h-8 w-8" />
                </Button>
            </div>
        </div>
    );
}
