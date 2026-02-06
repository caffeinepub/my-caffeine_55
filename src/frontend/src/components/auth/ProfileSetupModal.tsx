import { useState } from 'react';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileSetupModal() {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('لطفاً نام خود را وارد کنید');
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success('پروفایل با موفقیت ایجاد شد!');
    } catch (error) {
      toast.error('ایجاد پروفایل ناموفق بود');
      console.error(error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>به ماما خوش آمدید!</DialogTitle>
          <DialogDescription>
            لطفاً نام خود را برای شروع به ما بگویید.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام شما</Label>
            <Input
              id="name"
              placeholder="نام خود را وارد کنید"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saveProfile.isPending}>
          {saveProfile.isPending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            'ادامه'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
