import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface ChatComposerProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending) return;

    setIsSending(true);
    try {
      await onSend(trimmedMessage);
      // Only clear on success
      setMessage('');
    } catch (error) {
      // Keep message on failure so user can retry
      console.error('Send failed, keeping message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || isSending;

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleSend} 
        disabled={isDisabled || !message.trim()}
        size="icon"
        className="h-[60px] w-[60px] flex-shrink-0"
      >
        {isSending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="پیام خود را بنویسید... (Enter برای ارسال، Shift+Enter برای خط جدید)"
        className="min-h-[60px] resize-none"
        disabled={isDisabled}
        dir="auto"
      />
    </div>
  );
}
