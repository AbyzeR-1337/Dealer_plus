// Chat phrase bank, part 2: what buyers ask about each kind of item, why they want it, and the honest
// answers the game builds from the item's real state. Questions are [topic, ru, uk, en].

const C = [
  ['why', 'А почему продаёте?', 'А чому продаєте?', 'Why are you selling?'], ['how_long', 'Сколько им пользовались?', 'Скільки ним користувалися?', 'How long have you had it?'],
  ['defects', 'Есть какие-то косяки, о которых стоит знать?', 'Є якісь недоліки, про які варто знати?', 'Any issues I should know about?'], ['photos', 'Можете прислать ещё пару фото при дневном свете?', 'Можете надіслати ще кілька фото при денному світлі?', 'Could you send a couple more photos in daylight?'],
  ['discount', 'Скинете немного?', 'Скинете трохи?', 'Any discount?'], ['video', 'Можно по видеосвязи показать?', 'Можна по відеозвʼязку показати?', 'Could you show it on a video call?'],
  ['meet', 'Где можно посмотреть вживую?', 'Де можна подивитися наживо?', 'Where can I see it in person?'], ['ship', 'Отправите доставкой в другой город?', 'Відправите доставкою в інше місто?', 'Will you ship to another city?'],
  ['box', 'Коробка, документы, комплект — всё есть?', 'Коробка, документи, комплект — усе є?', 'Box, papers, everything included?'], ['defects', 'Честно: с ним всё в порядке?', 'Чесно: з ним усе гаразд?', 'Honestly, is it all fine?'],
];
export const COMMON_Q = C;

export const Q = {
  phones: [
    ['battery', 'Какая ёмкость аккумулятора в настройках?', 'Яка ємність акумулятора в налаштуваннях?', 'What’s the battery health in settings?'], ['battery', 'Батарея держит день?', 'Батарея тримає день?', 'Does the battery last a day?'],
    ['repair', 'Его ремонтировали? Вскрывали?', 'Його ремонтували? Розкривали?', 'Has it been repaired or opened?'], ['screen', 'Экран родной?', 'Екран рідний?', 'Is the screen original?'],
    ['lock', 'Он отвязан от аккаунта? Pear ID / Gugle?', 'Він відвʼязаний від акаунта? Pear ID / Gugle?', 'Is it unlinked from the account?'], ['water', 'В воду не роняли?', 'У воду не впускали?', 'Ever dropped in water?'],
    ['face', 'Face ID / отпечаток работает?', 'Face ID / відбиток працює?', 'Does Face ID / fingerprint work?'], ['scratches', 'Царапины на экране есть?', 'Подряпини на екрані є?', 'Any scratches on the screen?'],
    ['body', 'Корпус не гнутый? Сколы на рамке?', 'Корпус не гнутий? Сколи на рамці?', 'Is the frame bent? Any chips?'], ['sound', 'Динамики не хрипят?', 'Динаміки не хриплять?', 'Do the speakers crackle?'],
    ['charge', 'Заряжается нормально, разъём не болтается?', 'Заряджається нормально, розʼєм не теліпається?', 'Charges fine? Port not loose?'], ['lens', 'Камера фокусируется? Стекло камеры целое?', 'Камера фокусується? Скло камери ціле?', 'Does the camera focus? Lens glass intact?'],
    ['receipt', 'Чек остался? Гарантия?', 'Чек залишився? Гарантія?', 'Got the receipt? Warranty?'], ['orig', 'Не реф? Не восстановленный?', 'Не реф? Не відновлений?', 'Not refurbished?'],
    ['simlock', 'С любыми симками работает?', 'З будь-якими сімками працює?', 'Works with any SIM?'], ['body', 'Кнопки все нажимаются?', 'Кнопки всі натискаються?', 'Do all the buttons work?'],
  ],
  electronics: [
    ['battery', 'Сколько циклов у батареи?', 'Скільки циклів у батареї?', 'How many battery cycles?'], ['screen', 'Битых пикселей нет?', 'Битих пікселів немає?', 'No dead pixels?'],
    ['keys', 'Клавиатура не западает?', 'Клавіатура не западає?', 'Keyboard OK, no sticky keys?'], ['sound', 'Кулер не шумит под нагрузкой?', 'Кулер не шумить під навантаженням?', 'Fan noisy under load?'],
    ['water', 'Залития не было?', 'Залиття не було?', 'Ever had a spill?'], ['body', 'Петли не разболтаны?', 'Петлі не розхитані?', 'Hinges tight?'],
    ['repair', 'В сервисе был?', 'У сервісі був?', 'Ever serviced?'], ['power', 'Включается сразу, без танцев?', 'Вмикається одразу, без танців?', 'Powers on straight away?'],
    ['lens', 'Объектив без царапин и грибка?', 'Обʼєктив без подряпин і грибка?', 'Lens free of scratches and fungus?'], ['mileage', 'Какой пробег затвора?', 'Який пробіг затвора?', 'What’s the shutter count?'],
    ['lock', 'Аккаунт отвязан?', 'Акаунт відвʼязано?', 'Account removed?'], ['box', 'Зарядка родная?', 'Зарядка рідна?', 'Original charger?'],
  ],
  consoles: [
    ['ban', 'В сети не забанена?', 'У мережі не забанена?', 'Not banned online?'], ['disc', 'Диски читает?', 'Диски читає?', 'Does it read discs?'],
    ['drift', 'Геймпад без дрифта?', 'Геймпад без дрифту?', 'Controller without drift?'], ['sound', 'Не гудит как самолёт?', 'Не гуде як літак?', 'Not jet-engine loud?'],
    ['video', 'HDMI не шатается?', 'HDMI не хитається?', 'HDMI port solid?'], ['repair', 'Прошитая? Вскрывали?', 'Прошита? Розкривали?', 'Modded? Opened?'],
    ['box', 'Игры в комплекте есть?', 'Ігри в комплекті є?', 'Any games included?'], ['yellow', 'Пластик не пожелтел?', 'Пластик не пожовтів?', 'Has the plastic yellowed?'],
    ['power', 'Включается и не перегревается?', 'Вмикається і не перегрівається?', 'Turns on, no overheating?'], ['lock', 'Аккаунт отвяжете?', 'Акаунт відвʼяжете?', 'Will you remove your account?'],
  ],
  accessories: [
    ['battery', 'Сколько держит заряд?', 'Скільки тримає заряд?', 'How long does a charge last?'], ['sound', 'Оба уха играют?', 'Обидва вуха грають?', 'Do both sides play?'],
    ['orig', 'Оригинал? Серийник пробивается?', 'Оригінал? Серійник пробивається?', 'Original? Serial checks out?'], ['broken', 'Крепления целые?', 'Кріплення цілі?', 'Clips and hinges intact?'],
    ['scratches', 'Царапин нет?', 'Подряпин немає?', 'No scratches?'], ['box', 'Кейс и провод в комплекте?', 'Кейс і дріт у комплекті?', 'Case and cable included?'],
    ['wear', 'Амбушюры не стёрты?', 'Амбушури не стерті?', 'Ear pads worn?'], ['repair', 'Не меняли батарею?', 'Не міняли батарею?', 'Battery replaced?'],
  ],
  sneakers: [
    ['size', 'Какой размер по стельке в см?', 'Який розмір по устілці в см?', 'Insole length in cm?'], ['orig', 'Оригинал? Легит-чек проходили?', 'Оригінал? Легіт-чек проходили?', 'Authentic? Legit checked?'],
    ['wear', 'Сколько раз надевали?', 'Скільки разів одягали?', 'How many times worn?'], ['sole', 'Подошва не пожелтела, не отклеивается?', 'Підошва не пожовкла, не відклеюється?', 'Sole yellowed or separating?'],
    ['wear', 'Заломы на носке сильные?', 'Заломи на носку сильні?', 'Toe box creasing bad?'], ['smell', 'Запаха нет? 😅', 'Запаху немає? 😅', 'No smell? 😅'],
    ['stains', 'Пятна есть?', 'Плями є?', 'Any stains?'], ['box', 'Родная коробка и бирки?', 'Рідна коробка і бирки?', 'Original box and tags?'],
    ['insole', 'Стельки не стёрты?', 'Устілки не стерті?', 'Insoles worn?'], ['paint', 'Краска нигде не облезла?', 'Фарба ніде не облізла?', 'Paint peeling anywhere?'],
    ['receipt', 'Где покупали?', 'Де купували?', 'Where were they bought?'], ['size', 'Маломерят или в размер?', 'Маломірять чи в розмір?', 'Run small or true to size?'],
  ],
  clothing: [
    ['size', 'Какой размер, замеры дадите?', 'Який розмір, заміри дасте?', 'What size? Can you give measurements?'], ['orig', 'Оригинал? Бирки, QR-код есть?', 'Оригінал? Бирки, QR-код є?', 'Authentic? Tags, QR code?'],
    ['stains', 'Пятна, затяжки есть?', 'Плями, затяжки є?', 'Stains or snags?'], ['holes', 'Дырок нет?', 'Дірок немає?', 'Any holes?'], ['wear', 'Катышки есть?', 'Катишки є?', 'Any pilling?'],
    ['fade', 'Не выцвел после стирок?', 'Не вилиняв після прання?', 'Faded from washing?'], ['zip', 'Молния работает?', 'Блискавка працює?', 'Zip works?'],
    ['smell', 'Из дома без животных и курящих?', 'З дому без тварин і курців?', 'Smoke- and pet-free home?'], ['tags', 'Бирки не срезаны?', 'Бирки не зрізані?', 'Tags still on?'],
    ['size', 'Не сел после стирки?', 'Не сів після прання?', 'Hasn’t shrunk?'], ['how_long', 'Носили много?', 'Носили багато?', 'Worn a lot?'],
  ],
  bags: [
    ['orig', 'Оригинал? Есть чек или карта подлинности?', 'Оригінал? Є чек чи картка автентичності?', 'Authentic? Receipt or authenticity card?'], ['box', 'Пыльник, коробка в комплекте?', 'Пильник, коробка в комплекті?', 'Dust bag and box included?'],
    ['wear', 'Углы потёрты?', 'Кути потерті?', 'Worn corners?'], ['wear', 'Ручки не потемнели?', 'Ручки не потемніли?', 'Handles darkened?'], ['hardware', 'Фурнитура без царапин?', 'Фурнітура без подряпин?', 'Hardware scratch-free?'],
    ['lining', 'Подкладка целая, без пятен от ручки?', 'Підкладка ціла, без плям від ручки?', 'Lining intact, no pen marks?'], ['smell', 'Запаха сигарет или духов нет?', 'Запаху сигарет чи парфумів немає?', 'Smell of smoke or perfume?'],
    ['body', 'Форму держит?', 'Форму тримає?', 'Does it hold its shape?'], ['receipt', 'Где покупалась? В бутике?', 'Де купувалася? У бутику?', 'Where was it bought? Boutique?'],
    ['stains', 'Пятна на коже есть?', 'Плями на шкірі є?', 'Stains on the leather?'], ['serial', 'Датакод/серийник читается?', 'Датакод/серійник читається?', 'Is the date code readable?'],
  ],
  watches: [
    ['running', 'Ход в норме? Сколько уходят в сутки?', 'Хід у нормі? Скільки відходять за добу?', 'Running well? Accuracy per day?'], ['service', 'Когда было последнее обслуживание?', 'Коли було останнє обслуговування?', 'When was the last service?'],
    ['orig', 'Оригинал, не франкен?', 'Оригінал, не франкен?', 'Genuine, not a frankenwatch?'], ['box', 'Коробка и документы — полный комплект?', 'Коробка і документи — повний комплект?', 'Full set, box and papers?'],
    ['scratches', 'Стекло без царапин?', 'Скло без подряпин?', 'Crystal scratch-free?'], ['service', 'Корпус полировали?', 'Корпус полірували?', 'Has the case been polished?'],
    ['service', 'Циферблат родной?', 'Циферблат рідний?', 'Original dial?'], ['bezel', 'Безель без сколов?', 'Безель без сколів?', 'Bezel chip-free?'],
    ['wear', 'Браслет не растянут?', 'Браслет не розтягнутий?', 'Bracelet stretched?'], ['body', 'Заводная коронка в порядке?', 'Заводна коронка в порядку?', 'Crown OK?'],
    ['receipt', 'Покупали у официального дилера?', 'Купували в офіційного дилера?', 'Bought from an authorised dealer?'], ['water', 'Водозащиту проверяли?', 'Водозахист перевіряли?', 'Water resistance tested?'],
  ],
  jewelry: [
    ['purity', 'Проба настоящая? Клеймо есть?', 'Проба справжня? Клеймо є?', 'Real hallmark? Is it stamped?'], ['stone', 'Камни все на месте?', 'Камені всі на місці?', 'All stones in place?'],
    ['orig', 'Сертификат на камень есть?', 'Сертифікат на камінь є?', 'Stone certificate?'], ['clasp', 'Замок надёжный?', 'Замок надійний?', 'Is the clasp secure?'],
    ['size', 'Какой размер кольца?', 'Який розмір каблучки?', 'Ring size?'], ['tarnish', 'Не темнеет?', 'Не темніє?', 'Does it tarnish?'],
    ['body', 'Не деформировано?', 'Не деформоване?', 'Not bent?'], ['receipt', 'Бирка из магазина сохранилась?', 'Бирка з магазину збереглася?', 'Store tag kept?'],
    ['scratches', 'Сильно ношенное?', 'Сильно ношене?', 'Heavily worn?'], ['box', 'Коробочка есть?', 'Коробочка є?', 'Box included?'],
  ],
  perfume: [
    ['fill', 'Сколько осталось во флаконе?', 'Скільки залишилося у флаконі?', 'How much is left?'], ['orig', 'Оригинал? Батч-код есть?', 'Оригінал? Батч-код є?', 'Original? Batch code?'],
    ['batch', 'Аромат не испортился? Как хранился?', 'Аромат не зіпсувався? Як зберігався?', 'Has it turned? How was it stored?'], ['cap', 'Крышка родная?', 'Кришка рідна?', 'Original cap?'],
    ['chip', 'Флакон без сколов?', 'Флакон без сколів?', 'Bottle chip-free?'], ['box', 'Коробка есть?', 'Коробка є?', 'Box included?'],
    ['batch', 'Какого года партия?', 'Якого року партія?', 'Which year’s batch?'], ['receipt', 'Откуда флакон?', 'Звідки флакон?', 'Where’s it from?'],
  ],
  cards: [
    ['grade', 'Карта в слабе? Какая оценка?', 'Карта в слабі? Яка оцінка?', 'Is it slabbed? Grade?'], ['centering', 'Центровка нормальная?', 'Центрування нормальне?', 'Centering OK?'],
    ['corners', 'Углы острые?', 'Кути гострі?', 'Sharp corners?'], ['surface', 'Царапины на голо есть?', 'Подряпини на голо є?', 'Any holo scratches?'], ['corners', 'Заломов нет?', 'Заломів немає?', 'No creases?'],
    ['orig', 'Не прокси? Не перепечатка?', 'Не проксі? Не передрук?', 'Not a proxy or reprint?'], ['surface', 'Края не подрезаны?', 'Краї не підрізані?', 'Edges not trimmed?'],
    ['stains', 'Пятен нет?', 'Плям немає?', 'No stains?'], ['receipt', 'Из какого бустера?', 'З якого бустера?', 'Which pack is it from?'],
  ],
  comics: [
    ['spine', 'Корешок без заломов?', 'Корінець без заломів?', 'Spine stress?'], ['pages', 'Все страницы на месте?', 'Усі сторінки на місці?', 'All pages there?'],
    ['restored', 'Реставрации не было?', 'Реставрації не було?', 'Any restoration?'], ['stains', 'Следов влаги нет?', 'Слідів вологи немає?', 'Water damage?'],
    ['fade', 'Обложка не выгорела?', 'Обкладинка не вигоріла?', 'Cover faded?'], ['grade', 'Грейдили?', 'Грейдили?', 'Was it graded?'], ['holes', 'Надрывов нет?', 'Надривів немає?', 'Any tears?'],
    ['orig', 'Первый тираж?', 'Перший тираж?', 'First print?'],
  ],
  toys: [
    ['pieces', 'Все детали на месте?', 'Усі деталі на місці?', 'All pieces included?'], ['boxdmg', 'Коробка целая?', 'Коробка ціла?', 'Box in good shape?'],
    ['orig', 'Оригинал, не китайская копия?', 'Оригінал, не китайська копія?', 'Original, not a knock-off?'], ['fade', 'На солнце не выгорела?', 'На сонці не вигоріла?', 'Sun faded?'],
    ['paint', 'Краска не стёрта?', 'Фарба не стерта?', 'Paint worn?'], ['broken', 'Ничего не сломано?', 'Нічого не зламано?', 'Anything broken?'], ['box', 'Инструкция есть?', 'Інструкція є?', 'Instructions included?'],
    ['how_long', 'Собирали или стоял запечатанным?', 'Збирали чи стояв запечатаним?', 'Built or kept sealed?'],
  ],
  antiques: [
    ['age', 'Какого года? Есть клеймо мастера?', 'Якого року? Є клеймо майстра?', 'What year? Maker’s mark?'], ['restored', 'Реставрировали?', 'Реставрували?', 'Restored?'],
    ['crack', 'Трещин нет?', 'Тріщин немає?', 'No cracks?'], ['chip', 'Сколы есть?', 'Сколи є?', 'Any chips?'], ['mech', 'Механизм работает?', 'Механізм працює?', 'Does the mechanism work?'],
    ['provenance', 'Откуда вещь? История есть?', 'Звідки річ? Історія є?', 'Where’s it from? Any history?'], ['orig', 'Не новодел?', 'Не новодєл?', 'Not a modern copy?'], ['patina', 'Патина родная или чистили?', 'Патина рідна чи чистили?', 'Original patina or cleaned?'],
    ['docs', 'Вывозить за границу можно?', 'Вивозити за кордон можна?', 'Can it be exported?'],
  ],
  art: [
    ['provenance', 'Есть экспертиза?', 'Є експертиза?', 'Has it been appraised?'], ['orig', 'Подпись автора есть?', 'Підпис автора є?', 'Is it signed?'], ['crack', 'Красочный слой не осыпается?', 'Фарбовий шар не обсипається?', 'Paint flaking?'],
    ['holes', 'Холст без порывов?', 'Полотно без поривів?', 'Canvas tears?'], ['fade', 'Краски не выцвели?', 'Фарби не вицвіли?', 'Colours faded?'], ['frame', 'Рама родная?', 'Рама рідна?', 'Original frame?'],
    ['stains', 'Пятна есть?', 'Плями є?', 'Any stains?'], ['age', 'Какой год написания?', 'Який рік написання?', 'When was it painted?'],
  ],
  collectibles: [
    ['orig', 'Подлинник? Не копия?', 'Справжній? Не копія?', 'Genuine, not a copy?'], ['patina', 'Не чищена?', 'Не чищена?', 'Not cleaned?'], ['body', 'Не гнутая?', 'Не гнута?', 'Not bent?'],
    ['scratches', 'Царапины есть?', 'Подряпини є?', 'Scratches?'], ['grade', 'Сохран какой?', 'Збереженість яка?', 'What grade of preservation?'], ['stains', 'Пятна, окислы?', 'Плями, окиси?', 'Spots or oxidation?'],
    ['age', 'Год выпуска?', 'Рік випуску?', 'Year of issue?'], ['provenance', 'Откуда у вас?', 'Звідки у вас?', 'Where did you get it?'],
  ],
  instruments: [
    ['neck', 'Гриф ровный?', 'Гриф рівний?', 'Is the neck straight?'], ['electro', 'Звукосниматели работают, не трещат?', 'Звукознімачі працюють, не тріщать?', 'Pickups work, no crackle?'],
    ['frets', 'Лады сильно стёрты?', 'Лади сильно стерті?', 'Frets worn?'], ['crack', 'Трещины на корпусе есть?', 'Тріщини на корпусі є?', 'Body cracks?'], ['ikeys', 'Клавиши не западают?', 'Клавіші не западають?', 'Sticky keys?'],
    ['scratches', 'Дека поцарапана?', 'Дека подряпана?', 'Top scratched?'], ['box', 'Кейс в комплекте?', 'Кейс у комплекті?', 'Case included?'], ['orig', 'Не китайская копия?', 'Не китайська копія?', 'Not a Chinese copy?'],
  ],
  cars: [
    ['mileage', 'Пробег родной?', 'Пробіг рідний?', 'Is the mileage genuine?'], ['accident', 'В ДТП был?', 'У ДТП був?', 'Ever crashed?'], ['vpaint', 'Что крашено?', 'Що фарбовано?', 'Which panels are repainted?'],
    ['owners', 'Сколько владельцев по ПТС?', 'Скільки власників за техпаспортом?', 'How many owners on the title?'], ['docs', 'Залогов и ограничений нет?', 'Застав і обмежень немає?', 'Any liens or restrictions?'],
    ['engine', 'Двигатель не стучит? Масло не ест?', 'Двигун не стукає? Масло не їсть?', 'Engine knocks? Burns oil?'], ['engine', 'Коробка не пинается?', 'Коробка не штовхається?', 'Gearbox jerky?'],
    ['rust', 'Ржавчина есть? Пороги, арки?', 'Іржа є? Пороги, арки?', 'Rust? Sills, arches?'], ['tires', 'Резина какая, сколько осталось?', 'Гума яка, скільки залишилося?', 'Tyres, how much tread?'],
    ['electric', 'Электрика без глюков?', 'Електрика без глюків?', 'Electrics glitch-free?'], ['glass', 'Стекло лобовое целое?', 'Скло лобове ціле?', 'Windscreen intact?'], ['lights', 'Фары не мутные, не битые?', 'Фари не мутні, не биті?', 'Headlights clear and intact?'],
    ['service', 'Сервисная книжка есть?', 'Сервісна книжка є?', 'Service history?'], ['video', 'Можно на подъёмник загнать?', 'Можна на підйомник загнати?', 'Can we put it on a lift?'], ['meet', 'Можно с моим мастером приехать?', 'Можна з моїм майстром приїхати?', 'Can I bring my mechanic?'],
    ['accident', 'Подушки не стреляли?', 'Подушки не спрацьовували?', 'Airbags ever deployed?'],
  ],
  bikes: [
    ['mileage', 'Пробег реальный?', 'Пробіг реальний?', 'Real mileage?'], ['accident', 'Падал? Были ДТП?', 'Падав? Були ДТП?', 'Ever dropped or crashed?'], ['rust', 'Ржавчины нет?', 'Іржі немає?', 'Rust?'],
    ['brakes', 'Тормоза в порядке?', 'Гальма в порядку?', 'Brakes OK?'], ['tires', 'Колёса без восьмёрок?', 'Колеса без вісімок?', 'Wheels true?'], ['battery', 'Аккумулятор живой?', 'Акумулятор живий?', 'Battery alive?'],
    ['docs', 'Документы в порядке?', 'Документи в порядку?', 'Papers in order?'], ['service', 'Когда меняли масло/цепь?', 'Коли міняли масло/ланцюг?', 'Last oil/chain change?'], ['body', 'Бак без вмятин?', 'Бак без вмʼятин?', 'Tank dent-free?'],
  ],
  gear: [
    ['wear', 'Сильно потёрт?', 'Сильно потертий?', 'Very worn?'], ['zip', 'Молнии работают?', 'Блискавки працюють?', 'Zips OK?'], ['smell', 'Запаха нет?', 'Запаху немає?', 'No smell?'],
    ['broken', 'Ремни, колёса целые?', 'Ремені, колеса цілі?', 'Straps and wheels intact?'], ['accident', 'Шлем не падал?', 'Шолом не падав?', 'Helmet never dropped?'], ['orig', 'Оригинал?', 'Оригінал?', 'Original?'],
    ['stains', 'Пятна внутри есть?', 'Плями всередині є?', 'Stains inside?'],
  ],
  storage: [
    ['works', 'Определяется на компе нормально?', 'Визначається на компі нормально?', 'Does a PC detect it fine?'], ['sectors', 'Битых секторов нет? Проверяли?', 'Битих секторів немає? Перевіряли?', 'Any bad sectors? Did you test it?'],
    ['orig', 'Объём реальный, не китайская подделка?', 'Обʼєм реальний, не китайська підробка?', 'Real capacity, not a fake?'], ['data', 'Там что-то осталось или чистый?', 'Там щось лишилося чи чистий?', 'Anything left on it or is it clean?'],
    ['age', 'Сколько отработал?', 'Скільки відпрацював?', 'How many hours on it?'],
  ],
  misc: [
    ['orig', 'Это настоящее, не сувенир?', 'Це справжнє, не сувенір?', 'Is it real, not a souvenir?'], ['age', 'Сколько ему лет?', 'Скільки йому років?', 'How old is it?'], ['works', 'Работает?', 'Працює?', 'Does it work?'],
    ['provenance', 'Откуда у вас?', 'Звідки у вас?', 'Where did you get it?'], ['scratches', 'Царапины есть?', 'Подряпини є?', 'Scratches?'], ['broken', 'Ничего не сломано?', 'Нічого не зламано?', 'Anything broken?'],
  ],
};

// why the buyer wants it (adds life to the first message)
export const WHY_BUY = {
  phones: [['Себе, старый разбил.', 'Собі, старий розбив.', 'For me, I broke my old one.'], ['Маме на день рождения.', 'Мамі на день народження.', 'For my mum’s birthday.'], ['Сыну в школу.', 'Синові до школи.', 'For my son, for school.'], ['Рабочий, для такси.', 'Робочий, для таксі.', 'For work, I drive a cab.'], ['Хочу перейти с андроида.', 'Хочу перейти з андроїда.', 'Switching from Android.']],
  electronics: [['Для учёбы.', 'Для навчання.', 'For studies.'], ['Монтирую видео, нужен помощнее.', 'Монтую відео, потрібен потужніший.', 'I edit video, need more power.'], ['В поездки.', 'У подорожі.', 'For travel.'], ['Дочке для рисования.', 'Доньці для малювання.', 'For my daughter to draw.']],
  consoles: [['Сыну на Новый год.', 'Синові на Новий рік.', 'For my son for New Year.'], ['Ностальгия, играл в детстве.', 'Ностальгія, грав у дитинстві.', 'Nostalgia, played it as a kid.'], ['Играть с друзьями по выходным.', 'Грати з друзями на вихідних.', 'Weekend games with friends.'], ['Себе, отдохнуть после работы.', 'Собі, відпочити після роботи.', 'For me, to unwind after work.']],
  accessories: [['В зал, бегать.', 'У зал, бігати.', 'For the gym.'], ['Старые потерял в метро.', 'Старі загубив у метро.', 'Lost my old ones on the subway.'], ['Подарок девушке.', 'Подарунок дівчині.', 'A gift for my girlfriend.']],
  sneakers: [['Давно мечтал о такой паре.', 'Давно мріяв про таку пару.', 'Dreamed of this pair for ages.'], ['В коллекцию.', 'У колекцію.', 'For my collection.'], ['На каждый день.', 'На щодень.', 'For everyday wear.'], ['На свидание 😅', 'На побачення 😅', 'For a date 😅'], ['Ищу свой размер уже месяц.', 'Шукаю свій розмір уже місяць.', 'Been looking for my size for a month.']],
  clothing: [['На зиму.', 'На зиму.', 'For winter.'], ['Под новые кроссы.', 'Під нові кроси.', 'To match new sneakers.'], ['Брату в подарок.', 'Братові в подарунок.', 'A gift for my brother.'], ['Люблю этот бренд.', 'Люблю цей бренд.', 'Love this brand.']],
  bags: [['Себе на годовщину 🙈', 'Собі на річницю 🙈', 'For myself, anniversary 🙈'], ['Жене в подарок.', 'Дружині в подарунок.', 'A gift for my wife.'], ['Хочу первую люксовую сумку.', 'Хочу першу люксову сумку.', 'My first luxury bag.'], ['На работу, нужна вместительная.', 'На роботу, потрібна місткa.', 'For work, need a roomy one.']],
  watches: [['Подарок отцу на юбилей.', 'Подарунок батькові на ювілей.', 'A gift for my dad’s jubilee.'], ['Закрываю мечту.', 'Закриваю мрію.', 'Ticking off a dream.'], ['Как вложение.', 'Як вкладення.', 'As an investment.'], ['Ношу каждый день, нужны надёжные.', 'Ношу щодня, потрібен надійний.', 'Daily wear, need a reliable one.']],
  jewelry: [['Хочу сделать предложение 💍', 'Хочу зробити пропозицію 💍', 'Planning to propose 💍'], ['Маме на 8 марта.', 'Мамі на 8 березня.', 'For my mum.'], ['Себе, порадовать.', 'Собі, потішити.', 'Treating myself.']],
  perfume: [['Мой любимый аромат, сняли с производства.', 'Мій улюблений аромат, зняли з виробництва.', 'My favourite, discontinued.'], ['Подарок мужу.', 'Подарунок чоловікові.', 'A gift for my husband.'], ['Хочу попробовать, прежде чем брать полный.', 'Хочу спробувати, перш ніж брати повний.', 'Want to try before buying full size.']],
  cards: [['Собираю сет.', 'Збираю сет.', 'Completing a set.'], ['Сыну в коллекцию.', 'Синові в колекцію.', 'For my son’s collection.'], ['Хочу отправить на грейдинг.', 'Хочу відправити на грейдинг.', 'Planning to send it for grading.']],
  comics: [['Не хватает этого номера.', 'Не вистачає цього номера.', 'Missing this issue.'], ['Читал в детстве.', 'Читав у дитинстві.', 'Read it as a kid.'], ['Для коллекции, в рамку.', 'Для колекції, в рамку.', 'For the collection, to frame.']],
  toys: [['Ребёнку на день рождения.', 'Дитині на день народження.', 'For my kid’s birthday.'], ['Сам собираю, не смейтесь 😄', 'Сам збираю, не смійтеся 😄', 'I collect them myself, don’t laugh 😄'], ['Для полки в кабинете.', 'Для полиці в кабінеті.', 'For my office shelf.']],
  antiques: [['На дачу, люблю старину.', 'На дачу, люблю старовину.', 'For my dacha, I love old things.'], ['Для интерьера ресторана.', 'Для інтерʼєру ресторану.', 'For a restaurant interior.'], ['Как у бабушки было.', 'Як у бабусі було.', 'Like my grandma had.']],
  art: [['Для гостиной.', 'Для вітальні.', 'For the living room.'], ['Коллекционирую этого автора.', 'Колекціоную цього автора.', 'I collect this artist.'], ['В подарок партнёру по бизнесу.', 'У подарунок партнерові по бізнесу.', 'A gift for a business partner.']],
  collectibles: [['Для коллекции.', 'Для колекції.', 'For my collection.'], ['Отцу, он собирает.', 'Батькові, він збирає.', 'For my dad, he collects.'], ['Давно ищу такую.', 'Давно шукаю таку.', 'Been looking for one.']],
  instruments: [['Учусь играть.', 'Вчуся грати.', 'Learning to play.'], ['В группу, нужен второй.', 'У гурт, потрібен другий.', 'For my band, need a second one.'], ['Ребёнку в музыкалку.', 'Дитині в музичну школу.', 'For my kid’s music school.']],
  cars: [['Первая машина.', 'Перша машина.', 'My first car.'], ['Для семьи, ребёнок родился.', 'Для родини, дитина народилася.', 'For the family, we had a baby.'], ['Под такси.', 'Під таксі.', 'For taxi work.'], ['Жене, чтобы возить детей.', 'Дружині, щоб возити дітей.', 'For my wife to drive the kids.'], ['Проект, хочу восстановить.', 'Проєкт, хочу відновити.', 'A project, want to restore it.']],
  bikes: [['На сезон покататься.', 'На сезон покататися.', 'To ride this season.'], ['Под доставку.', 'Під доставку.', 'For delivery work.'], ['Первый мот, учусь.', 'Перший мот, вчуся.', 'My first bike, learning.']],
  gear: [['В поход.', 'У похід.', 'For hiking.'], ['На страйкбол.', 'На страйкбол.', 'For airsoft.'], ['В поездку.', 'У поїздку.', 'For a trip.']],
  storage: [['Под бэкапы.', 'Під бекапи.', 'For backups.'], ['Для фотоаппарата.', 'Для фотоапарата.', 'For my camera.'], ['Коллекционирую старые носители.', 'Колекціоную старі носії.', 'I collect old media.'], ['Систему переставить.', 'Систему перевстановити.', 'For a new system drive.']],
  misc: [['Коллекционирую такое.', 'Колекціоную таке.', 'I collect these.'], ['Просто понравилось.', 'Просто сподобалося.', 'Just liked it.'], ['Подарок деду.', 'Подарунок дідові.', 'A gift for my grandpa.']],
};

// my reasons for selling (used for the 'why' question)
export const MY_WHY = [
  ['Купил новый, этот лежит без дела.', 'Купив новий, цей лежить без діла.', 'Got a new one, this just sits around.'], ['Переезжаю, распродаю лишнее.', 'Переїжджаю, розпродаю зайве.', 'Moving, selling extras.'],
  ['Подарили, не пользуюсь.', 'Подарували, не користуюся.', 'It was a gift, I don’t use it.'], ['Нужны деньги на другое.', 'Потрібні гроші на інше.', 'Need money for something else.'], ['Не подошёл, к сожалению.', 'Не підійшов, на жаль.', 'Didn’t suit me, sadly.'],
  ['Освобождаю место дома.', 'Звільняю місце вдома.', 'Freeing up space at home.'], ['Перекупаю и продаю, не скрываю 🙂', 'Перекуповую і продаю, не приховую 🙂', 'I buy and resell, no secret 🙂'],
];
export const MY_HOWLONG = [
  ['Около года.', 'Близько року.', 'About a year.'], ['Пару месяцев.', 'Кілька місяців.', 'A couple of months.'], ['У меня недавно, до этого был один владелец.', 'У мене нещодавно, до цього був один власник.', 'Recently got it, one owner before me.'],
  ['Почти не пользовался.', 'Майже не користувався.', 'Barely used it.'], ['Года три, бережно.', 'Років три, дбайливо.', 'About three years, carefully.'],
];

// honest answers by topic: ok = nothing wrong, bad = the real problem ({fact} is filled from the item)
export const ANS = {
  battery: { ok: [['Батарея {fact}, держит нормально.', 'Батарея {fact}, тримає нормально.', 'Battery is at {fact}, lasts fine.']], bad: [['Батарея подуставшая: {fact}. Придётся менять.', 'Батарея втомлена: {fact}. Доведеться міняти.', 'Battery is tired: {fact}. Will need replacing.']] },
  screen: { ok: [['Экран родной, без полос и пятен.', 'Екран рідний, без смуг і плям.', 'Original screen, no lines or spots.']], bad: [['С экраном нюанс: {fact}.', 'З екраном нюанс: {fact}.', 'There’s a screen issue: {fact}.']] },
  repair: { ok: [['Не вскрывался, всё заводское.', 'Не розкривався, все заводське.', 'Never opened, all factory.']], bad: [['Был ремонт: {fact}.', 'Був ремонт: {fact}.', 'It has been repaired: {fact}.']] },
  lock: { ok: [['Отвязан, сброшен до заводских.', 'Відвʼязаний, скинутий до заводських.', 'Unlinked and factory reset.']], bad: [['Честно — есть блокировка: {fact}.', 'Чесно — є блокування: {fact}.', 'Honestly — it’s locked: {fact}.']] },
  water: { ok: [['В воду не попадал, индикатор белый.', 'У воду не потрапляв, індикатор білий.', 'Never got wet, sticker is white.']], bad: [['Был контакт с водой: {fact}.', 'Був контакт з водою: {fact}.', 'It has had water contact: {fact}.']] },
  face: { ok: [['Работает с первого раза.', 'Працює з першого разу.', 'Works first time.']], bad: [['Не работает: {fact}.', 'Не працює: {fact}.', 'It doesn’t work: {fact}.']] },
  defects: { ok: [['Из того, что знаю, — проблем нет.', 'З того, що знаю, — проблем немає.', 'Nothing wrong that I know of.']], bad: [['Есть нюансы: {fact}.', 'Є нюанси: {fact}.', 'A few issues: {fact}.']] },
  orig: { ok: [['Оригинал, можно проверить где угодно.', 'Оригінал, можна перевірити де завгодно.', 'Authentic, check it anywhere.']], bad: [['Скажу прямо: это реплика.', 'Скажу прямо: це репліка.', 'To be straight: it’s a replica.']] },
  box: { ok: [['Комплект: {fact}.', 'Комплект: {fact}.', 'Included: {fact}.']], bad: [['Только сам предмет, {fact}.', 'Тільки сама річ, {fact}.', 'Just the item, {fact}.']] },
  size: { ok: [['Размер {fact}, в размер.', 'Розмір {fact}, у розмір.', 'Size {fact}, true to size.']], bad: [['Размер {fact}, но сел после стирки.', 'Розмір {fact}, але сів після прання.', 'Size {fact}, but it has shrunk.']] },
  mileage: { ok: [['Пробег {fact}, родной.', 'Пробіг {fact}, рідний.', '{fact}, genuine.']], bad: [['На одометре {fact}, но, скорее всего, скручен.', 'На одометрі {fact}, але, найімовірніше, скручений.', '{fact} on the clock, but it’s probably rolled back.']] },
  owners: { any: [['По документам владельцев: {fact}.', 'За документами власників: {fact}.', 'Owners on the papers: {fact}.']] },
  age: { any: [['Год — {fact}.', 'Рік — {fact}.', 'Year: {fact}.']] },
  fill: { ok: [['Осталось примерно {fact}.', 'Залишилося приблизно {fact}.', 'About {fact} left.']], bad: [['Осталось {fact}, и аромат слегка изменился.', 'Залишилося {fact}, і аромат трохи змінився.', '{fact} left and the scent has changed a bit.']] },
  grade: { ok: [['{fact}.', '{fact}.', '{fact}.']], bad: [['{fact}.', '{fact}.', '{fact}.']] },
  sectors: { ok: [['Проверял программой — ни одного битого сектора.', 'Перевіряв програмою — жодного битого сектора.', 'Scanned it — not a single bad sector.']], bad: [['Честно: {fact}. Под важные данные не советую.', 'Чесно: {fact}. Під важливі дані не раджу.', 'Honestly: {fact}. Not for important data.']] },
  data: { any: [['Перед отправкой отформатирую, будет чистый.', 'Перед відправкою відформатую, буде чистий.', 'I’ll format it before shipping, it’ll be clean.'], ['Не смотрел, что там. Могу стереть.', 'Не дивився, що там. Можу стерти.', 'Didn’t check what’s on it. I can wipe it.']] },
  generic: { ok: [['С этим всё в порядке.', 'З цим усе гаразд.', 'That’s all fine.'], ['Нет, такого нет.', 'Ні, такого немає.', 'No, nothing like that.'], ['Проверял — всё отлично.', 'Перевіряв — усе чудово.', 'Checked it — all good.']], bad: [['Да, есть: {fact}.', 'Так, є: {fact}.', 'Yes, there is: {fact}.'], ['Скрывать не буду: {fact}.', 'Приховувати не буду: {fact}.', 'I won’t hide it: {fact}.']] },
};
