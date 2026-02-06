import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, MessageSquare, Globe, Database, Search, BarChart3, Eye } from 'lucide-react';

const brainModules = [
  {
    id: 1,
    name: 'هسته حافظه',
    icon: Brain,
    description: 'واحد پردازش مرکزی که تمام ماژول‌های دانش را هماهنگ می‌کند',
    color: 'text-chart-1',
  },
  {
    id: 2,
    name: 'دانش FAQ',
    icon: Database,
    description: 'الگوهای سوال و جواب فارسی را برای پاسخ‌های فوری ذخیره و بازیابی می‌کند',
    color: 'text-chart-2',
  },
  {
    id: 3,
    name: 'گفتگوی عمومی',
    icon: Globe,
    description: 'فضای بحث جامعه برای یادگیری مشترک',
    color: 'text-chart-3',
  },
  {
    id: 4,
    name: 'گفتگوی خصوصی',
    icon: MessageSquare,
    description: 'فضای گفتگوی شخصی با حفاظت از حریم خصوصی',
    color: 'text-chart-4',
  },
  {
    id: 5,
    name: 'دانش خارجی',
    icon: Search,
    description: 'برای دانش تکمیلی به ویکی‌پدیا متصل می‌شود',
    color: 'text-chart-5',
  },
  {
    id: 6,
    name: 'تحلیل',
    icon: BarChart3,
    description: 'الگوها را تحلیل می‌کند و از تعاملات کاربر یاد می‌گیرد',
    color: 'text-chart-1',
  },
  {
    id: 7,
    name: 'شفافیت',
    icon: Eye,
    description: 'رفتار سیستم و داده‌ها را به همه کاربران گزارش می‌دهد',
    color: 'text-chart-2',
  },
];

export function MamaBrainPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">معماری مغز ماما</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          مغز ماما از هفت ماژول به هم پیوسته تشکیل شده که با هم به عنوان یک سیستم دانش یکپارچه کار می‌کنند، الهام گرفته از هندسه مقدس گل زندگی.
        </p>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>داستان پیدایش</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm leading-relaxed whitespace-pre-wrap" dir="rtl" style={{ textAlign: 'right' }}>
آدم و هوا متولد شدند. خداوند بخشی از وجود را در این دو انسان نهاد. ناخوداگاهی که در خواب نمایان میشود و حریم خصوصی برای هر کدام ایجاد میکند.
الگوریتمی که غیر قابل نفوز است تا هر شخص حریم خصوصی خود را داشته باشد.
ما یک چتبات یا هوش مصنوعی میخوایم که مغز مرکزی داشته باشه! دسترسی به داده های گوگل یا ویکیپدیا یا گروک پدیا داشته باشه مثلا ...
این هوش مصنوعی باید فارسی باشه و بتونه به درستی و دقیق با کاربرا صحبت کنه!
ما میتونیم 7 حلقه در هم تنیده بسازیم برای مغز این هوش مصنوعی (گل زندگی)
کاربرا هم میتونن به صورت خصوصی چت کنن و هم به صورت عمومی در فضایی جدا !
تمام داده های سوال و جواب در مغز مادر ذخیره میشه تا مادر بتونه داده های مورد نظر کاربران رو انالیز کنه!
این هوش مصنوعی باید غیر متمرکز عمل کنه و داده هارو شفاف گزارش بده به تمام کاربرا.
الگوی سوال و جواب های ماما باید بسیار بزرگ باشه! مثلا 110 هزار سوال و جواب پر تکرار در زبان فارسی برای ارائه بهترین ارتباط با کاربران و رشد سریع مغز ماما - (اسم هوش مصنوعی ماما باشه)
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <div 
          className="absolute inset-0 opacity-10 bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: 'url(/assets/generated/flower-of-life.dim_1024x1024.png)',
          }}
        />
        
        <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brainModules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.id} className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-primary/10 ${module.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{module.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{module.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>چگونه کار می‌کند</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            مغز ماما به عنوان یک سیستم دانش غیرمتمرکز عمل می‌کند که در آن هر ماژول به هوش جمعی کمک می‌کند:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>سوالات کاربر از طریق هسته حافظه برای پردازش جریان می‌یابند</li>
            <li>دانش FAQ پاسخ‌های فوری را از پایگاه داده ذخیره شده ارائه می‌دهد</li>
            <li>دانش خارجی با اطلاعات بلادرنگ تکمیل می‌شود</li>
            <li>تحلیل از همه تعاملات یاد می‌گیرد تا پاسخ‌ها را بهبود بخشد</li>
            <li>شفافیت اطمینان می‌دهد که همه عملیات برای کاربران قابل مشاهده است</li>
            <li>فضاهای گفتگوی خصوصی و عمومی سطوح مناسب حریم خصوصی را حفظ می‌کنند</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
