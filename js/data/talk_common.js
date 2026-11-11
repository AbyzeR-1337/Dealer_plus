// Chat phrase bank, part 1: everything that is not tied to an item category.
// Every phrase is [ru, uk, en]. Placeholders: {item} {price} {platform} {district} {city} {days} {name} {fact}.

// writing styles: the same person writes the same way through the whole chat
export const VOICES = ['formal', 'casual', 'slang', 'elder', 'terse', 'emoji', 'gentle'];
export const VOICE_BY_TRAIT = {
  greedy: ['casual', 'terse', 'slang'], polite: ['formal', 'gentle', 'casual'], reseller: ['terse', 'casual', 'slang'],
  collector: ['formal', 'casual', 'gentle'], newbie: ['emoji', 'casual', 'gentle'], haggler: ['casual', 'slang', 'elder'],
  rich: ['terse', 'casual', 'formal'], angry: ['terse', 'slang'], scammer: ['formal', 'emoji', 'casual'],
};

export const HELLO = {
  formal: [
    ['Здравствуйте!', 'Доброго дня!', 'Good afternoon!'], ['Добрый день.', 'Добрий день.', 'Good day.'], ['Здравствуйте, подскажите, пожалуйста.', 'Добрий день, підкажіть, будь ласка.', 'Hello, could you help me, please.'],
    ['Добрый вечер. Извините за беспокойство.', 'Добрий вечір. Вибачте за турботу.', 'Good evening. Sorry to bother you.'], ['Здравствуйте, меня зовут {name}.', 'Добрий день, мене звати {name}.', 'Hello, my name is {name}.'],
    ['Приветствую.', 'Вітаю.', 'Greetings.'], ['Доброе утро!', 'Доброго ранку!', 'Good morning!'], ['Здравствуйте, пишу по объявлению.', 'Добрий день, пишу щодо оголошення.', 'Hello, I’m writing about your listing.'],
  ],
  casual: [
    ['Привет!', 'Привіт!', 'Hi!'], ['Привет, по объявлению.', 'Привіт, щодо оголошення.', 'Hey, about the listing.'], ['Добрый 👋', 'Добрий 👋', 'Hey 👋'], ['Здрасьте', 'Здрасті', 'Hiya'],
    ['Привет-привет', 'Привіт-привіт', 'Hey hey'], ['О, привет.', 'О, привіт.', 'Oh, hi.'], ['Хай!', 'Хай!', 'Hi there!'], ['Привет, не спишь?', 'Привіт, не спиш?', 'Hey, still up?'],
  ],
  slang: [
    ['Ку', 'Ку', 'Yo'], ['Здарова', 'Здоров', 'Sup'], ['Хай бро', 'Хай бро', 'Hey bro'], ['Йо', 'Йо', 'Yo yo'], ['Салют', 'Салют', 'Hey man'],
    ['Ку, на связи?', 'Ку, на звʼязку?', 'Yo, you there?'], ['Здаров, братан', 'Здоров, брате', 'Hey dude'], ['Приветос', 'Привітулі', 'Heyyy'],
  ],
  elder: [
    ['Добрый день, молодой человек.', 'Добрий день, юначе.', 'Good day, young man.'], ['Здравствуйте. Я по поводу объявления…', 'Добрий день. Я з приводу оголошення…', 'Hello. It’s about the advert…'],
    ['Алло, здравствуйте. Это вы продаёте?', 'Алло, добрий день. Це ви продаєте?', 'Hello? Is it you selling?'], ['Доброго здоровья!', 'Доброго здоровʼя!', 'Good health to you!'],
    ['Здравствуйте. Мне внук показал ваше объявление.', 'Добрий день. Мені онук показав ваше оголошення.', 'Hello. My grandson showed me your advert.'], ['Здравствуйте… как тут писать… А, вот.', 'Добрий день… як тут писати… А, ось.', 'Hello… how do I type here… ah, there.'],
  ],
  terse: [
    ['Добрый.', 'Добрий.', 'Hi.'], ['Актуально?', 'Актуально?', 'Available?'], ['Здр.', 'Здр.', 'Hey.'], ['По объявлению.', 'Щодо оголошення.', 'Re: listing.'], ['Привет.', 'Привіт.', 'Hi.'], ['Вопрос.', 'Питання.', 'Question.'],
  ],
  emoji: [
    ['Привееет 😊', 'Привіііт 😊', 'Hiii 😊'], ['Здравствуйте 🙂🙂', 'Доброго дня 🙂🙂', 'Hello 🙂🙂'], ['Хеллоу ✨', 'Хелоу ✨', 'Hellooo ✨'], ['Приветик 🌸', 'Привітик 🌸', 'Hey there 🌸'],
    ['Добрый вечер 🌙', 'Добрий вечір 🌙', 'Good evening 🌙'], ['Ой, здравствуйте 🙈', 'Ой, доброго дня 🙈', 'Oh, hello 🙈'],
  ],
  gentle: [
    ['Здравствуйте 🙂', 'Доброго дня 🙂', 'Hello 🙂'], ['Добрый день! Надеюсь, не отвлекаю.', 'Добрий день! Сподіваюся, не відволікаю.', 'Hi! Hope I’m not interrupting.'],
    ['Здравствуйте, простите за поздний час.', 'Добрий вечір, вибачте за пізню годину.', 'Hello, sorry for the late hour.'], ['Привет! Можно вопрос?', 'Привіт! Можна питання?', 'Hi! Can I ask something?'],
    ['Добрый день, очень понравилось ваше объявление.', 'Добрий день, дуже сподобалося ваше оголошення.', 'Hi, I really like your listing.'],
  ],
};

// how they found the listing
export const FOUND = [
  ['Увидел ваше объявление на {platform}.', 'Побачив ваше оголошення на {platform}.', 'Saw your listing on {platform}.'],
  ['Искал по запросу «{model}» — вы первый в выдаче.', 'Шукав за запитом «{model}» — ви перший у видачі.', 'Searched for “{model}” and you came up first.'],
  ['Мне друг скинул ссылку на ваше объявление.', 'Мені друг скинув посилання на ваше оголошення.', 'A friend sent me your link.'],
  ['Попалось в рекомендациях, решил написать.', 'Трапилося в рекомендаціях, вирішив написати.', 'It popped up in my recommendations.'],
  ['Третий день смотрю на это объявление и не выдержал.', 'Третій день дивлюся на це оголошення і не витримав.', 'I’ve been staring at this listing for three days.'],
  ['Увидел, что вы снизили цену.', 'Побачив, що ви знизили ціну.', 'Noticed you dropped the price.'],
  ['Нашёл через поиск по району {district}, живу рядом.', 'Знайшов через пошук по району {district}, живу поруч.', 'Found it by searching {district} — I live nearby.'],
  ['Жена увидела и сказала: напиши.', 'Дружина побачила і сказала: напиши.', 'My wife saw it and told me to write.'],
  ['Сын попросил узнать.', 'Син попросив дізнатися.', 'My son asked me to ask.'],
  ['Подписан на этот раздел, только что пришло уведомление.', 'Підписаний на цей розділ, щойно прийшло сповіщення.', 'I follow this section — just got a notification.'],
  ['Сохранил в избранное ещё на прошлой неделе.', 'Зберіг в обране ще минулого тижня.', 'Saved it to favourites last week.'],
  ['Видел такой же у знакомого, давно хочу.', 'Бачив такий самий у знайомого, давно хочу.', 'Saw one at a friend’s, wanted one ever since.'],
  ['Мой прошлый сломался, ищу замену.', 'Мій попередній зламався, шукаю заміну.', 'My old one broke, looking for a replacement.'],
  ['В чате перекупов кто-то скинул ваш пост.', 'У чаті перекупів хтось скинув ваш пост.', 'Someone dropped your post in a resellers chat.'],
  ['Сравнивал цены — у вас самая адекватная.', 'Порівнював ціни — у вас найадекватніша.', 'Compared prices — yours is the most reasonable.'],
  ['Смотрел похожие, у вас фото честнее всех.', 'Дивився схожі, у вас фото найчесніші.', 'Looked at similar ones, your photos are the most honest.'],
  ['Сосед сказал, что вы нормальный продавец.', 'Сусід сказав, що ви нормальний продавець.', 'My neighbour said you’re a decent seller.'],
  ['Наткнулся случайно, пока искал другое.', 'Натрапив випадково, поки шукав інше.', 'Stumbled on it while looking for something else.'],
  ['Объявление висит давно — значит, можно поторговаться? 😏', 'Оголошення висить давно — отже, можна поторгуватися? 😏', 'It’s been up a while — so there’s room to haggle? 😏'],
  ['Увидел в ленте, пока ехал в метро.', 'Побачив у стрічці, поки їхав у метро.', 'Saw it in my feed on the subway.'],
  ['Мне ваш профиль порекомендовали в группе.', 'Мені ваш профіль порадили в групі.', 'Your profile was recommended in a group.'],
  ['Ищу подарок, ваше объявление подходит идеально.', 'Шукаю подарунок, ваше оголошення підходить ідеально.', 'Looking for a gift, your listing fits perfectly.'],
  ['Уже покупал у вас раньше, всё было ок.', 'Вже купував у вас раніше, все було ок.', 'Bought from you before, all was fine.'],
  ['Подруга сказала, что видела у вас.', 'Подруга сказала, що бачила у вас.', 'A friend said she saw it at yours.'],
  ['Залип на фото, очень красиво сняли.', 'Залип на фото, дуже гарно зняли.', 'Got hooked on the photos, nicely shot.'],
  ['Увидел на {platform}, в {city} больше нет таких.', 'Побачив на {platform}, у {city} більше немає таких.', 'Saw it on {platform} — there are no others in {city}.'],
  ['Только что вышло в поиске, надеюсь, я первый.', 'Щойно вийшло в пошуку, сподіваюся, я перший.', 'Just appeared in search, hope I’m first.'],
  ['Мне алгоритм показал вас уже раз пять, видимо, судьба.', 'Мені алгоритм показав вас уже разів пʼять, мабуть, доля.', 'The algorithm showed you to me five times — must be fate.'],
  ['Пролистал сто объявлений — остановился на вашем.', 'Прогорнув сто оголошень — зупинився на вашому.', 'Scrolled through a hundred listings and stopped at yours.'],
  ['Коллега по работе посоветовал.', 'Колега по роботі порадив.', 'A colleague recommended it.'],
];

// short trait colour added to the opening line
export const TRAIT_LINE = {
  greedy: [
    ['Цены, конечно, у вас…', 'Ціни, звісно, у вас…', 'Your prices though…'], ['Сразу скажу: за такие деньги не возьму.', 'Одразу скажу: за такі гроші не візьму.', 'Straight up: not at that price.'],
    ['Видел дешевле, но у вас ближе.', 'Бачив дешевше, але у вас ближче.', 'Saw it cheaper, but you’re closer.'], ['Дорого. Но поговорим.', 'Дорого. Але поговоримо.', 'Pricey. But let’s talk.'],
    ['Скидку сделаете — заберу.', 'Знижку зробите — заберу.', 'Discount and I’ll take it.'], ['Это же не новое, почему так дорого?', 'Це ж не нове, чому так дорого?', 'It’s not new — why so expensive?'],
  ],
  polite: [
    ['Если можно, чуть-чуть скидки 🙏', 'Якщо можна, трохи знижки 🙏', 'A small discount would be lovely 🙏'], ['Буду очень благодарен за ответ.', 'Буду дуже вдячний за відповідь.', 'I’d be grateful for a reply.'],
    ['Не торопитесь с ответом.', 'Не поспішайте з відповіддю.', 'No rush replying.'], ['Вещь очень понравилась.', 'Річ дуже сподобалася.', 'Really like the item.'],
    ['Готов подъехать в удобное вам время.', 'Готовий підʼїхати у зручний вам час.', 'Happy to come whenever suits you.'],
  ],
  reseller: [
    ['Беру сразу, если отдашь по-нормальному.', 'Беру одразу, якщо віддаси по-нормальному.', 'I’ll take it now if the price is right.'], ['Деньги на руках, решаем быстро.', 'Гроші на руках, вирішуємо швидко.', 'Cash in hand, let’s be quick.'],
    ['Возьму оптом, если есть ещё.', 'Візьму оптом, якщо є ще.', 'I’ll buy in bulk if you have more.'], ['Мне для перепродажи, так что без лирики.', 'Мені для перепродажу, тож без лірики.', 'It’s for resale, so no fluff.'],
    ['Скажи последнюю цену.', 'Скажи останню ціну.', 'Give me your final price.'],
  ],
  collector: [
    ['Давно ищу именно такой экземпляр!', 'Давно шукаю саме такий екземпляр!', 'I’ve been hunting this exact piece!'], ['Для коллекции, буду беречь.', 'Для колекції, берегтиму.', 'For my collection, it’ll be well kept.'],
    ['Таких в продаже почти нет.', 'Таких у продажу майже немає.', 'There are hardly any for sale.'], ['Важна каждая мелочь, поэтому много вопросов.', 'Важлива кожна дрібниця, тож багато питань.', 'Every detail matters, so I’ll ask a lot.'],
    ['Ради такого готов приехать хоть ночью.', 'Заради такого готовий приїхати хоч уночі.', 'For this I’d come over at midnight.'],
  ],
  newbie: [
    ['Всё точно в порядке? Я в этом не разбираюсь…', 'Усе точно гаразд? Я в цьому не розбираюся…', 'Is it definitely OK? I’m not an expert…'], ['Первый раз покупаю с рук, немного волнуюсь.', 'Вперше купую з рук, трохи хвилююся.', 'First time buying second-hand, a bit nervous.'],
    ['Подскажите, как лучше проверить?', 'Підкажіть, як краще перевірити?', 'How should I check it?'], ['Мне бы что-то надёжное 🙂', 'Мені б щось надійне 🙂', 'I just want something reliable 🙂'],
    ['Можно глупый вопрос?', 'Можна дурне питання?', 'Can I ask a silly question?'],
  ],
  haggler: [
    ['Давайте поторгуемся, я не богач.', 'Давайте поторгуємося, я не багатій.', 'Let’s haggle, I’m not rich.'], ['Торг уместен?', 'Торг доречний?', 'Is the price negotiable?'],
    ['Всегда торгуюсь, не обижайтесь.', 'Завжди торгуюся, не ображайтеся.', 'I always haggle, don’t take it personally.'], ['Ну вы же понимаете, что цену можно подвинуть.', 'Ну ви ж розумієте, що ціну можна посунути.', 'You know the price can move.'],
    ['Скинете за самовывоз?', 'Скинете за самовивіз?', 'Discount for pickup?'],
  ],
  rich: [
    ['Без лишних слов. Устроит?', 'Без зайвих слів. Влаштує?', 'No small talk. Deal?'], ['Беру. Куда подъехать?', 'Беру. Куди підʼїхати?', 'I’m in. Where do I come?'],
    ['Пришлю водителя.', 'Надішлю водія.', 'I’ll send my driver.'], ['Цена не вопрос, главное — сегодня.', 'Ціна не питання, головне — сьогодні.', 'Price isn’t an issue, it has to be today.'],
  ],
  angry: [
    ['Только быстро, у меня мало времени.', 'Тільки швидко, у мене мало часу.', 'Make it quick, I’m busy.'], ['Надеюсь, это не очередной развод.', 'Сподіваюся, це не черговий розвод.', 'Hope this isn’t another scam.'],
    ['Третий продавец за день, все врут.', 'Третій продавець за день, усі брешуть.', 'Third seller today, they all lie.'], ['Отвечайте по делу.', 'Відповідайте по суті.', 'Stick to the point.'],
  ],
  scammer: [
    ['Беру за полную цену, даже больше!', 'Беру за повну ціну, навіть більше!', 'I’ll pay full price, even more!'], ['Оплачу через безопасную сделку, не переживайте.', 'Оплачу через безпечну угоду, не хвилюйтеся.', 'I’ll pay via safe deal, don’t worry.'],
    ['Я в другом городе, но курьер всё заберёт.', 'Я в іншому місті, але курʼєр усе забере.', 'I’m in another city, a courier will collect.'], ['Торг не нужен, сразу оформим доставку.', 'Торг не потрібен, одразу оформимо доставку.', 'No haggling needed, let’s set up delivery.'],
    ['Дайте ваш номер, оплачу прямо сейчас.', 'Дайте ваш номер, оплачу просто зараз.', 'Give me your number, I’ll pay right now.'],
  ],
};

// buyer reacts to an answer
export const REACT = {
  ok: [
    ['Отлично, это главное.', 'Чудово, це головне.', 'Great, that’s what matters.'], ['Супер, спасибо!', 'Супер, дякую!', 'Super, thanks!'], ['Понял, хорошо.', 'Зрозумів, добре.', 'Got it, good.'],
    ['О, это радует.', 'О, це тішить.', 'Oh, good to hear.'], ['Класс 👍', 'Клас 👍', 'Nice 👍'], ['Тогда интересно.', 'Тоді цікаво.', 'Then I’m interested.'], ['Приятно иметь дело с честным человеком.', 'Приємно мати справу з чесною людиною.', 'Nice to deal with an honest person.'],
    ['Ага, ясно.', 'Ага, ясно.', 'Aha, clear.'], ['Вот это хорошо.', 'Ось це добре.', 'That’s good.'],
  ],
  bad: [
    ['Хм. Тогда цена должна быть другой.', 'Хм. Тоді ціна має бути іншою.', 'Hm. Then the price should be different.'], ['Спасибо, что честно сказали.', 'Дякую, що чесно сказали.', 'Thanks for being honest.'],
    ['Неприятно, но лучше знать заранее.', 'Неприємно, але краще знати заздалегідь.', 'Not great, but better to know.'], ['Ну это минус, конечно.', 'Ну це мінус, звісно.', 'Well, that’s a minus.'],
    ['Тогда давайте обсудим скидку.', 'Тоді давайте обговоримо знижку.', 'Then let’s talk discount.'], ['Ремонт — это ещё деньги…', 'Ремонт — це ще гроші…', 'A repair costs extra…'], ['Ценю честность. Подумаю.', 'Ціную чесність. Подумаю.', 'I appreciate honesty. Let me think.'],
  ],
  vague: [
    ['Не очень понятно ответили…', 'Не дуже зрозуміло відповіли…', 'That wasn’t very clear…'], ['То есть есть нюансы?', 'Тобто є нюанси?', 'So there are issues?'], ['Хм, уходите от ответа.', 'Хм, ухиляєтеся від відповіді.', 'Hm, you’re dodging.'],
    ['Ладно, посмотрю на месте.', 'Гаразд, подивлюся на місці.', 'Fine, I’ll see in person.'], ['Ну окей…', 'Ну окей…', 'Well, okay…'], ['Надеюсь, без сюрпризов.', 'Сподіваюся, без сюрпризів.', 'Hope there are no surprises.'],
  ],
  social: [
    ['Понятно 🙂', 'Зрозуміло 🙂', 'I see 🙂'], ['Ясно, спасибо.', 'Ясно, дякую.', 'Clear, thanks.'], ['Окей, договоримся.', 'Окей, домовимося.', 'Okay, we’ll sort it out.'], ['Хорошо, удобно.', 'Добре, зручно.', 'Good, that works.'],
  ],
};

// money talk
export const OFFER = [
  ['Могу {price}. Это нормальная цена, не обижайтесь.', 'Можу {price}. Це нормальна ціна, не ображайтеся.', 'I can do {price}. That’s fair, no offence.'], ['Предлагаю {price}.', 'Пропоную {price}.', 'I offer {price}.'],
  ['{price} — и забираю сегодня.', '{price} — і забираю сьогодні.', '{price} and I pick it up today.'], ['Отдадите за {price}?', 'Віддасте за {price}?', 'Would you take {price}?'],
  ['Есть {price} наличкой прямо сейчас.', 'Є {price} готівкою просто зараз.', 'I have {price} cash right now.'], ['Как насчёт {price}?', 'Як щодо {price}?', 'How about {price}?'],
  ['Больше {price} не дам, честно.', 'Більше {price} не дам, чесно.', 'I won’t go over {price}, honestly.'], ['{price} и не думайте долго 😉', '{price} і не думайте довго 😉', '{price}, don’t think too long 😉'],
  ['Готов {price}, могу перевести на карту.', 'Готовий {price}, можу переказати на картку.', 'Ready to pay {price}, card transfer.'], ['За {price} заберу хоть через час.', 'За {price} заберу хоч за годину.', 'For {price} I’ll grab it within an hour.'],
  ['Бюджет у меня {price}, это потолок.', 'Бюджет у мене {price}, це стеля.', 'My budget is {price}, that’s the ceiling.'], ['{price}? Только честно, без обид.', '{price}? Тільки чесно, без образ.', '{price}? No hard feelings.'],
];
export const COUNTER = [
  ['Ну хорошо, {price}. Это максимум.', 'Ну добре, {price}. Це максимум.', 'Fine, {price}. That’s my max.'], ['Давайте сойдёмся на {price}.', 'Давайте зійдемося на {price}.', 'Let’s meet at {price}.'],
  ['{price}, и по рукам?', '{price}, і по руках?', '{price} and we have a deal?'], ['Поднимусь до {price}, но дальше никак.', 'Піднімуся до {price}, але далі ніяк.', 'I’ll go up to {price}, no further.'],
  ['Эх… {price}. Последнее слово.', 'Ех… {price}. Останнє слово.', 'Ugh… {price}. Final word.'], ['Середина — {price}. Справедливо же?', 'Середина — {price}. Справедливо ж?', 'Halfway — {price}. Fair, right?'],
  ['Могу {price}, если отдадите сегодня.', 'Можу {price}, якщо віддасте сьогодні.', 'I can do {price} if it’s today.'], ['Ладно, накину: {price}.', 'Гаразд, накину: {price}.', 'Okay, I’ll add a bit: {price}.'],
];
export const ACCEPT = [
  ['Договорились! 🤝', 'Домовилися! 🤝', 'Deal! 🤝'], ['Отлично, беру.', 'Чудово, беру.', 'Great, I’ll take it.'], ['По рукам. Оформляйте.', 'По руках. Оформлюйте.', 'Done. Let’s do it.'],
  ['Идёт! Когда можно забрать?', 'Іде! Коли можна забрати?', 'Deal! When can I collect?'], ['Ура, моё 😍', 'Ура, моє 😍', 'Yay, it’s mine 😍'], ['Окей, всё, беру.', 'Окей, все, беру.', 'Okay, sold.'],
  ['Хорошо, договорились. Спасибо!', 'Добре, домовилися. Дякую!', 'Alright, agreed. Thanks!'], ['Забираю. Скиньте детали.', 'Забираю. Скиньте деталі.', 'Taking it. Send the details.'],
];
export const DECLINE = [
  ['Нет, дорого. Удачи.', 'Ні, дорого. Удачі.', 'Nah, too pricey. Good luck.'], ['Не, я пас.', 'Ні, я пас.', 'I’ll pass.'], ['Найду дешевле.', 'Знайду дешевше.', 'I’ll find it cheaper.'],
  ['Спасибо, подумаю ещё.', 'Дякую, подумаю ще.', 'Thanks, I’ll think about it.'], ['Нет, это не моё.', 'Ні, це не моє.', 'No, not for me.'], ['Не договоримся, увы.', 'Не домовимося, на жаль.', 'We won’t agree, sadly.'],
  ['Жена сказала нет 😅', 'Дружина сказала ні 😅', 'My wife said no 😅'], ['Уже купил в другом месте, извините.', 'Вже купив в іншому місці, вибачте.', 'Already bought elsewhere, sorry.'],
  ['Слишком много нюансов для такой цены.', 'Забагато нюансів для такої ціни.', 'Too many issues for this price.'], ['Дорого для б/у. Всего доброго.', 'Дорого для вживаного. Усього доброго.', 'Too much for used. Take care.'],
];
export const ANGRY_LEAVE = [
  ['Сами его носите за такие деньги 😤', 'Самі його носіть за такі гроші 😤', 'Keep it at that price 😤'], ['Жадность до добра не доводит.', 'Жадібність до добра не доводить.', 'Greed never ends well.'],
  ['Всё, удаляю чат.', 'Все, видаляю чат.', 'That’s it, deleting the chat.'], ['Время только потратил.', 'Час тільки витратив.', 'Total waste of time.'], ['Спекулянт. 😡', 'Спекулянт. 😡', 'Profiteer. 😡'],
];
export const PUSHBACK = [
  ['Не надо меня уговаривать.', 'Не треба мене вмовляти.', 'Don’t push me.'], ['Все так говорят.', 'Усі так кажуть.', 'Everyone says that.'], ['Ну-ну.', 'Ну-ну.', 'Sure, sure.'],
  ['Мне не нужны сказки, нужна цена.', 'Мені не потрібні казки, потрібна ціна.', 'I need a price, not stories.'], ['Это не аргумент.', 'Це не аргумент.', 'That’s not an argument.'],
];
export const PERSUADED = [
  ['Ладно, убедили. {price}?', 'Гаразд, переконали. {price}?', 'Okay, you convinced me. {price}?'], ['Хм, логично. Давайте {price}.', 'Хм, логічно. Давайте {price}.', 'Hm, fair. Let’s say {price}.'],
  ['Умеете продавать 😄 {price}.', 'Вмієте продавати 😄 {price}.', 'You know how to sell 😄 {price}.'], ['Ну раз так — {price}.', 'Ну раз так — {price}.', 'Well then — {price}.'],
];
export const MY_PITCH = [
  ['Посмотрите, состояние отличное, такого больше не найдёте.', 'Подивіться, стан відмінний, такого більше не знайдете.', 'Look at the condition — you won’t find another like it.'],
  ['За эти деньги — лучший вариант на рынке.', 'За ці гроші — найкращий варіант на ринку.', 'Best deal on the market for this money.'],
  ['У меня уже есть ещё один покупатель…', 'У мене вже є ще один покупець…', 'I have another buyer lined up…'],
  ['Сравните с новым — разница огромная, а выглядит так же.', 'Порівняйте з новим — різниця величезна, а виглядає так само.', 'Compare to new — huge saving, looks the same.'],
  ['Я отвечаю за качество, можете проверить при мне.', 'Я відповідаю за якість, можете перевірити при мені.', 'I stand by it, check it in front of me.'],
  ['Цена уже ниже рынка, я просто хочу быстро продать.', 'Ціна вже нижча за ринок, я просто хочу швидко продати.', 'It’s already below market, I just want a quick sale.'],
];
// my side of the chat
export const ME = {
  hello: [
    ['Здравствуйте! Да, ещё продаётся.', 'Добрий день! Так, ще продається.', 'Hello! Yes, still available.'], ['Привет! Актуально 👍', 'Привіт! Актуально 👍', 'Hi! Still for sale 👍'],
    ['Добрый день, да, в наличии.', 'Добрий день, так, у наявності.', 'Good day, yes, it’s available.'], ['Да, ещё у меня. Что интересует?', 'Так, ще в мене. Що цікавить?', 'Yes, still have it. What would you like to know?'],
  ],
  counter: [['Могу отдать за {price}.', 'Можу віддати за {price}.', 'I can let it go for {price}.'], ['Давайте {price} — и он ваш.', 'Давайте {price} — і він ваш.', 'Make it {price} and it’s yours.'], ['Меньше {price} не могу.', 'Менше {price} не можу.', 'Can’t go below {price}.']],
  evasive: [
    ['Всё видно на фото, приезжайте — посмотрите.', 'Усе видно на фото, приїжджайте — подивитеся.', 'It’s all in the photos — come and see.'], ['Нормальное состояние, без сюрпризов.', 'Нормальний стан, без сюрпризів.', 'Decent condition, no surprises.'],
    ['Пользовался аккуратно, вроде всё ок.', 'Користувався акуратно, наче все ок.', 'Used it carefully, seems fine.'], ['На месте всё проверите.', 'На місці все перевірите.', 'You can check everything in person.'],
    ['Как у всех б/у, ничего особенного.', 'Як у всіх вживаних, нічого особливого.', 'Like any used one, nothing special.'],
  ],
  lie: [
    ['Всё идеально, никаких проблем.', 'Усе ідеально, жодних проблем.', 'All perfect, no issues at all.'], ['Состояние как новое, честно.', 'Стан як новий, чесно.', 'Like new, honestly.'],
    ['Нет-нет, с этим всё в порядке.', 'Ні-ні, з цим усе гаразд.', 'No, no, that’s all fine.'], ['Ни разу не было проблем.', 'Жодного разу не було проблем.', 'Never had a single problem.'],
  ],
};

// meeting / shipping
export const LOGISTICS = [
  ['Где можно посмотреть?', 'Де можна подивитися?', 'Where can I see it?'], ['Отправите доставкой?', 'Відправите доставкою?', 'Can you ship it?'], ['Можно сегодня вечером?', 'Можна сьогодні ввечері?', 'Can I come tonight?'],
  ['Вы у метро?', 'Ви біля метро?', 'Are you near the metro?'], ['Привезёте к офису? Доплачу за такси.', 'Привезете до офісу? Доплачу за таксі.', 'Bring it to my office? I’ll pay the cab.'],
  ['Можно завтра утром до работы?', 'Можна завтра вранці до роботи?', 'Tomorrow morning before work?'], ['Встретимся в торговом центре?', 'Зустрінемося в торговому центрі?', 'Meet at the mall?'],
  ['Оплата при получении подойдёт?', 'Оплата при отриманні підійде?', 'Cash on delivery OK?'],
];
export const MY_LOGISTICS = [
  ['Можно у меня, район {district}.', 'Можна в мене, район {district}.', 'At my place, {district} area.'], ['Отправлю в день оплаты.', 'Відправлю в день оплати.', 'I ship the day you pay.'],
  ['Сегодня после семи удобно.', 'Сьогодні після сьомої зручно.', 'Today after seven works.'], ['Давайте у метро, там светло и людно.', 'Давайте біля метро, там світло й людно.', 'Let’s meet at the metro, it’s busy and lit.'],
];

// scam scripts: each one ends with a link or a request
export const SCAMS = [
  { k: 'link', tx: ['Я оплатил! Подтвердите получение денег по ссылке: {link}', 'Я оплатив! Підтвердіть отримання грошей за посиланням: {link}', 'Paid! Confirm the payment here: {link}'] },
  { k: 'link', tx: ['Оформил «Безопасную сделку». Чтобы получить деньги, введите данные карты: {link}', 'Оформив «Безпечну угоду». Щоб отримати гроші, введіть дані картки: {link}', 'Set up a “Safe deal”. Enter your card to receive the money: {link}'] },
  { k: 'link', tx: ['Курьер уже едет! Заполните форму доставки: {link}', 'Курʼєр уже їде! Заповніть форму доставки: {link}', 'Courier is on the way! Fill in the delivery form: {link}'] },
  { k: 'link', tx: ['Деньги зависли в системе. Служба поддержки просит подтвердить: {link}', 'Гроші зависли в системі. Служба підтримки просить підтвердити: {link}', 'The payment is stuck. Support asks you to confirm: {link}'] },
  { k: 'link', tx: ['Скинул вам предоплату с запасом 😊 Заберите по ссылке: {link}', 'Скинув вам передоплату із запасом 😊 Заберіть за посиланням: {link}', 'Sent a prepayment with extra 😊 Claim it: {link}'] },
  { k: 'code', tx: ['Пришлите код из СМС, это для подтверждения перевода.', 'Надішліть код з СМС, це для підтвердження переказу.', 'Send me the SMS code, it’s to confirm the transfer.'] },
  { k: 'code', tx: ['Банк просит назвать код, который вам пришёл. Иначе перевод отменится.', 'Банк просить назвати код, який вам прийшов. Інакше переказ скасується.', 'The bank asks for the code you got, or the transfer is cancelled.'] },
  { k: 'code', tx: ['Сейчас вам позвонят «из банка», просто продиктуйте цифры 🙏', 'Зараз вам зателефонують «з банку», просто продиктуйте цифри 🙏', 'You’ll get a call “from the bank”, just read out the digits 🙏'] },
  { k: 'shot', tx: ['Вот скрин перевода ✅ Отправляйте, деньги дойдут в течение суток.', 'Ось скрін переказу ✅ Відправляйте, гроші дійдуть протягом доби.', 'Here’s the transfer screenshot ✅ Ship it, money lands within a day.'] },
  { k: 'shot', tx: ['Банк задерживает, но вот чек об оплате. Отправите сегодня?', 'Банк затримує, але ось чек про оплату. Відправите сьогодні?', 'The bank is slow, but here’s the receipt. Ship today?'] },
  { k: 'over', tx: ['Ой, перевёл на {extra} больше. Верните разницу на эту карту, пожалуйста.', 'Ой, переказав на {extra} більше. Поверніть різницю на цю картку, будь ласка.', 'Oops, sent {extra} too much. Please refund the difference to this card.'] },
  { k: 'link', tx: ['Давайте перейдём в мессенджер, там удобнее: {link}', 'Давайте перейдемо в месенджер, там зручніше: {link}', 'Let’s move to a messenger, easier there: {link}'] },
];
export const SCAM_LINKS = ['dostavka-pay.top/confirm', 'olx-safe.site/pay', 'avito-dostavka.icu/money', 'secure-deliv.xyz/card', 'nova-p0shta.pay/claim', 'safe-deal-pay.online/get', 'cdek-dostavka.link/form', 'pay-verify.click/card', 'marketplace-help.site/refund'];

// after the sale
export const THANKS = [
  ['Спасибо, всё пришло, всё отлично! 👍', 'Дякую, все прийшло, все чудово! 👍', 'Thanks, it arrived, all good! 👍'], ['Получил! Как и в описании, спасибо.', 'Отримав! Як в описі, дякую.', 'Got it! Just as described, thanks.'],
  ['Упаковано на совесть, спасибо!', 'Упаковано на совість, дякую!', 'Packed really well, thank you!'], ['Всё супер, буду обращаться ещё.', 'Усе супер, звертатимуся ще.', 'All great, will buy again.'],
  ['Дочка в восторге 😍', 'Донька в захваті 😍', 'My daughter is thrilled 😍'], ['Проверил — всё работает. Рекомендую продавца.', 'Перевірив — усе працює. Рекомендую продавця.', 'Checked — all works. Recommended.'],
  ['Быстро, честно, без сюрпризов.', 'Швидко, чесно, без сюрпризів.', 'Fast, honest, no surprises.'], ['Огонь, спасибо 🔥', 'Вогонь, дякую 🔥', 'Fire, thanks 🔥'],
];
export const REVIEW_GOOD = [
  ['Отличный продавец, всё как в описании.', 'Чудовий продавець, усе як в описі.', 'Great seller, exactly as described.'], ['Быстро ответил, быстро отправил.', 'Швидко відповів, швидко відправив.', 'Quick to reply, quick to ship.'],
  ['Вежливый, честный, рекомендую.', 'Ввічливий, чесний, рекомендую.', 'Polite, honest, recommended.'], ['Вещь в лучшем состоянии, чем на фото!', 'Річ у кращому стані, ніж на фото!', 'Even better than in the photos!'],
  ['Сам рассказал обо всех нюансах — уважение.', 'Сам розповів про всі нюанси — повага.', 'Told me every flaw upfront — respect.'], ['Упаковка 10/10.', 'Пакування 10/10.', 'Packaging 10/10.'],
  ['Сделка прошла идеально.', 'Угода пройшла ідеально.', 'Perfect deal.'], ['Приятный человек, легко договорились.', 'Приємна людина, легко домовилися.', 'Nice person, easy to deal with.'],
  ['Немного торговались, но всё честно.', 'Трохи торгувалися, але все чесно.', 'Some haggling, but all fair.'], ['Буду следить за вашими объявлениями.', 'Стежитиму за вашими оголошеннями.', 'I’ll keep an eye on your listings.'],
];
export const REVIEW_OK = [
  ['В целом нормально, но долго отвечал.', 'Загалом нормально, але довго відповідав.', 'Fine overall, but slow to reply.'], ['Вещь ок, упаковка так себе.', 'Річ ок, пакування так собі.', 'Item OK, packaging meh.'],
  ['Есть мелкие потёртости, о которых не сказали.', 'Є дрібні потертості, про які не сказали.', 'Minor scuffs that weren’t mentioned.'], ['Нормально, но цена завышена.', 'Нормально, але ціна завищена.', 'OK, but overpriced.'],
];
export const REVIEW_BAD = [
  ['Скрыл дефект. Не рекомендую.', 'Приховав дефект. Не рекомендую.', 'Hid a defect. Not recommended.'], ['Написал в чате одно, а по факту другое.', 'Написав у чаті одне, а насправді інше.', 'Said one thing in chat, reality was another.'],
  ['Продаёт подделки! Не связывайтесь.', 'Продає підробки! Не звʼязуйтеся.', 'Sells fakes! Avoid.'], ['Посылка пришла мятой, вещь пострадала.', 'Посилка прийшла мʼятою, річ постраждала.', 'Parcel arrived crushed, item damaged.'],
  ['Отказался вернуть деньги.', 'Відмовився повернути гроші.', 'Refused to refund.'], ['Обманщик. Поддержка подтвердила.', 'Ошуканець. Підтримка підтвердила.', 'Liar. Support confirmed it.'],
];
export const CLAIM = [
  ['Вы продали мне вещь с дефектом: {defect}. Верните деньги!', 'Ви продали мені річ із дефектом: {defect}. Поверніть гроші!', 'You sold me a faulty item: {defect}. I want a refund!'],
  ['Здравствуйте. Обнаружил {defect}. В объявлении об этом ни слова.', 'Добрий день. Виявив {defect}. В оголошенні про це ані слова.', 'Hello. Found this: {defect}. Nothing about it in the listing.'],
  ['Это что такое? {defect}! Я так не договаривался.', 'Це що таке? {defect}! Я так не домовлявся.', 'What is this? {defect}! That wasn’t the deal.'],
  ['Мастер сказал: {defect}. Жду возврат или компенсацию.', 'Майстер сказав: {defect}. Чекаю на повернення або компенсацію.', 'The repairman says: {defect}. I expect a refund or compensation.'],
];
export const CLAIM_LIE = [
  ['Вы же писали в чате, что {topic} в порядке! А тут {defect}. Это обман.', 'Ви ж писали в чаті, що {topic} гаразд! А тут {defect}. Це обман.', 'You wrote in the chat that the {topic} was fine! It’s {defect}. That’s a lie.'],
  ['У меня есть скрин переписки: вы сказали, что всё идеально. Возвращайте деньги.', 'У мене є скрін листування: ви сказали, що все ідеально. Повертайте гроші.', 'I have a screenshot of our chat: you said it was perfect. Refund me.'],
];
export const CLAIM_FAKE = [
  ['Я проверил — это ПОДДЕЛКА! Возвращайте деньги, или пишу в полицию.', 'Я перевірив — це ПІДРОБКА! Повертайте гроші, або пишу в поліцію.', 'I checked — it’s a FAKE! Refund me or I’m going to the police.'],
  ['Отнёс на легит-чек — реплика. Как вам не стыдно?', 'Відніс на легіт-чек — репліка. Як вам не соромно?', 'Took it for a legit check — replica. Shame on you.'],
];

// support agents
export const AGENTS = [['Алина', 'Аліна', 'Alina'], ['Дмитрий', 'Дмитро', 'Dmitry'], ['Ксения', 'Ксенія', 'Kseniya'], ['Артём', 'Артем', 'Artem'], ['Марина', 'Марина', 'Marina'], ['Олег', 'Олег', 'Oleg'], ['Виктория', 'Вікторія', 'Victoria'], ['Сергей', 'Сергій', 'Sergey']];
export const SUPPORT = {
  ack: [
    ['Здравствуйте! Меня зовут {agent}, я занимаюсь вашим обращением.', 'Добрий день! Мене звати {agent}, я опікуюся вашим зверненням.', 'Hello! I’m {agent} and I’m handling your request.'],
    ['Обращение принято. Специалист {agent} уже изучает материалы.', 'Звернення прийнято. Фахівець {agent} вже вивчає матеріали.', 'Request received. {agent} is reviewing the details.'],
    ['Спасибо, что написали. {agent} на связи — разберёмся.', 'Дякуємо, що написали. {agent} на звʼязку — розберемося.', 'Thanks for reaching out. {agent} here — we’ll sort it out.'],
  ],
  wait: [
    ['Проверяем переписку и историю сделки. Это займёт немного времени.', 'Перевіряємо листування та історію угоди. Це займе трохи часу.', 'Checking the chat and deal history. This will take a little while.'],
    ['Запросили объяснения у второй стороны.', 'Запросили пояснення у другої сторони.', 'We’ve asked the other party for their side.'],
    ['Передали в отдел безопасности сделок.', 'Передали у відділ безпеки угод.', 'Passed to the deal safety team.'],
  ],
  win: [
    ['Решение в вашу пользу. Спасибо за терпение!', 'Рішення на вашу користь. Дякуємо за терпіння!', 'Decision in your favour. Thanks for your patience!'],
    ['Мы проверили — вы правы. Меры приняты.', 'Ми перевірили — ви маєте рацію. Заходів ужито.', 'We checked — you’re right. Action has been taken.'],
  ],
  lose: [
    ['К сожалению, доказательств недостаточно. Обращение закрыто.', 'На жаль, доказів недостатньо. Звернення закрито.', 'Unfortunately there isn’t enough evidence. Case closed.'],
    ['Переписка подтверждает позицию второй стороны.', 'Листування підтверджує позицію другої сторони.', 'The chat log supports the other party.'],
  ],
};
