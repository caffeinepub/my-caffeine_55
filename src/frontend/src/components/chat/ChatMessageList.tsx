import type { Message } from '../../backend';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

interface ChatMessageListProps {
  messages: Message[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const { identity } = useInternetIdentity();
  const currentUserPrincipal = identity?.getPrincipal().toString();

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground">هنوز پیامی وجود ندارد</p>
          <p className="text-sm text-muted-foreground">گفتگو با ماما را شروع کنید!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isCurrentUser = message.author.toString() === currentUserPrincipal;
        const isMama = message.content.startsWith('[Mama]') || message.content.startsWith('[ماما]');
        
        let timestamp: Date;
        try {
          timestamp = new Date(Number(message.timestamp) / 1000000);
        } catch (error) {
          timestamp = new Date();
        }

        return (
          <div
            key={index}
            className={`flex gap-3 ${isCurrentUser && !isMama ? 'flex-row-reverse' : ''}`}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className={isMama ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                {isMama ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>

            <div className={`flex-1 space-y-1 ${isCurrentUser && !isMama ? 'text-left' : 'text-right'}`}>
              <div className={`inline-block max-w-[80%] rounded-lg p-3 ${
                isMama 
                  ? 'bg-primary/10 text-foreground' 
                  : isCurrentUser 
                    ? 'bg-accent text-accent-foreground' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                <p className="text-sm whitespace-pre-wrap break-words" dir="auto">
                  {message.content}
                </p>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                {timestamp.toLocaleTimeString('fa-IR')} • {timestamp.toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
