export const locales = ["ru", "uz", "kaa", "en"];
export const defaultLocale = "ru";

export const localeLabels = {
  ru: "Русский",
  uz: "O'zbekcha",
  kaa: "Qaraqalpaqsha",
  en: "English"
};

const translations = {
  ru: {
    app: {
      title: "Kungrad Admin",
      subtitle: "Операционные инструменты для саппорта",
      language: "Язык"
    },
    nav: {
      dashboard: "Дашборд",
      users: "Пользователи",
      clients: "Клиенты",
      partners: "Партнеры",
      outlets: "Точки",
      couriers: "Курьеры",
      orders: "Заказы",
      finance: "Финансы",
      promos: "Промокоды",
      audit: "Аудит"
    },
    common: {
      actions: "Действия",
      add: "Добавить",
      apply: "Применить",
      back: "Назад",
      cancel: "Отмена",
      close: "Закрыть",
      confirm: "Подтвердить",
      create: "Создать",
      delete: "Удалить",
      edit: "Изменить",
      next: "Вперед",
      page: "Страница {page} из {total}",
      role: "Роль",
      save: "Сохранить",
      search: "Поиск",
      status: "Статус",
      view: "Просмотр",
      yes: "Да",
      no: "Нет"
    },
    auth: {
      title: "Вход в админку",
      description: "Укажите Telegram ID и роль доступа.",
      tgId: "Telegram ID",
      tgPlaceholder: "Например: 123456789",
      role: "Роль",
      submit: "Войти"
    },
    errors: {
      authRequired: "401: Требуется авторизация.",
      forbidden: "403: Доступ запрещен.",
      notFoundUser: "404: Пользователь не найден.",
      notFoundClient: "404: Клиент не найден.",
      server: "500: Ошибка сервера.",
      api401: "401: нет авторизации",
      api403: "403: недостаточно прав",
      api404: "404: не найдено",
      api500: "500: ошибка сервера",
      apiUnknown: "Неизвестная ошибка",
      loadProfile: "Не удалось загрузить данные профиля."
    },
    dashboard: {
      title: "Дашборд",
      description: "Ключевые показатели и последние события платформы.",
      recentOrders: "Последние заказы",
      table: {
        orderId: "Номер",
        outlet: "Заведение",
        status: "Статус"
      },
      cards: {
        ordersToday: "Заказы сегодня",
        activeCouriers: "Активные курьеры",
        newClients: "Новые клиенты",
        serviceFee: "Сервисный сбор"
      },
      problemOrders: "Проблемные заказы",
      quickLinks: "Быстрые ссылки",
      noData: "Данных пока нет",
      table2: {
        orderId: "Номер заказа",
        status: "Статус",
        outlet: "Заведение",
        created: "Создан",
        actions: "Действия",
        view: "Открыть"
      }
    },
    pages: {
      users: {
        title: "Пользователи",
        description: "Список пользователей Telegram и их статусы.",
        filters: "Фильтры пользователей",
        searchPlaceholder: "Поиск по TG ID или username",
        allRoles: "Все роли",
        allStatuses: "Все статусы"
      },
      clients: {
        title: "Клиенты",
        description: "Быстрый поиск и управление клиентами."
      },
      partners: {
        title: "Партнеры",
        description: "Партнеры и точки доставки."
      },
      outlets: {
        title: "Точки",
        description: "Точки продаж и меню."
      },
      couriers: {
        title: "Курьеры",
        description: "Управление курьерами и их статусами."
      },
      orders: {
        title: "Заказы",
        description: "Поиск и управление заказами."
      },
      finance: {
        title: "Финансы",
        description: "Финансовый обзор (только чтение)."
      },
      promos: {
        title: "Промокоды",
        description: "Управление промо-кампаниями."
      },
      audit: {
        title: "Аудит",
        description: "История изменений и действий."
      }
    },
    users: {
      table: {
        tgId: "TG ID",
        username: "Username",
        role: "Роль",
        status: "Статус",
        id: "ID",
      actions: "Действия"
      },
      modals: {
        addTitle: "Добавить пользователя",
        updateTitle: "Обновить пользователя",
        deleteTitle: "Удалить пользователя",
        create: "Создать пользователя",
        update: "Обновить пользователя",
        delete: "Удалить пользователя",
        userId: "ID пользователя",
        username: "Username",
        role: "Роль",
        status: "Статус",
        keep: "Не менять",
        irreversible: "Действие необратимо."
      },
      overview: {
        title: "Основная информация",
        actions: "Действия",
        changeUsername: "Изменить username",
        changeRole: "Изменить роль",
        changeStatus: "Изменить статус",
        chooseRole: "Выберите роль",
        onlyAdmin: "Только для admin",
        chooseStatus: "Выберите статус",
        unblock: "Разблокировать",
        block: "Заблокировать",
        deleteUser: "Удалить пользователя",
        deleteWarning: "Действие необратимо",
        deleteOnlyAdmin: "Удаление доступно только admin"
      },
      orders: {
        title: "История заказов",
        searchPlaceholder: "Поиск по orderId",
        allStatuses: "Все статусы",
        table: {
          datetime: "Дата/время",
          outlet: "Ресторан",
          amount: "Сумма",
          status: "Статус",
          courier: "Курьер",
        }
      },
      finance: {
        title: "Финансы",
        table: {
          transaction: "Транзакция",
          amount: "Сумма",
          status: "Статус",
          date: "Дата"
        },
        summary: {
          payments: "Платежи",
          refunds: "Возвраты",
          promos: "Промокоды"
        }
      },
      profile: {
        title: "Профиль пользователя",
        eyebrow: "Профиль пользователя",
        idLabel: "ID"
      },
      fields: {
        createdAt: "Создан",
        updatedAt: "Обновлен",
        lastActive: "Последняя активность"
      },
      toasts: {
        updated: "Изменения сохранены",
        deleted: "Пользователь удален"
      },
      audit: {
        title: "Аудит"
      },
      activity: {
        title: "Активность"
      }
    },
    status: {
      active: "Активен",
      blocked: "Заблокирован",
      paused: "Пауза",
      pending: "В ожидании",
      completed: "Завершен",
      accepted_by_system: "Принят системой",
      accepted_by_restaurant: "Принят рестораном",
      ready_for_pickup: "Готов к выдаче",
      picked_up: "Курьер забрал",
      delivered: "Доставил"
    },
    roles: {
      admin: "admin",
      support: "support",
      operator: "operator",
      "read-only": "read-only",
      client: "client",
      courier: "courier",
      partner: "partner"
    },
    globalSearch: {
      placeholder: "Поиск по tg_id, имени или orderId",
      loading: "Идет поиск...",
      empty: "Ничего не найдено",
      groups: {
        users: "Users",
        clients: "Clients",
        orders: "Orders"
      }
    },
    confirm: {
      title: "Подтвердите действие",
      confirm: "Подтвердить",
      cancel: "Отмена"
    },
    tabs: {
      overview: "Обзор",
      orders: "Заказы",
      finance: "Финансы",
      activity: "Активность",
      audit: "Аудит",
      timeline: "Таймлайн",
      addresses: "Адреса",
      promos: "Промокоды",
      notes: "Заметки",
      outlets: "Точки",
      menu: "Меню / Товары",
      campaigns: "Кампании"
    },
    orders: {
      profile: {
        title: "Профиль заказа",
        description: "Проверьте доступ и идентификатор заказа.",
        eyebrow: "Профиль заказа",
        idLabel: "ID"
      },
      filters: {
        searchOrder: "Поиск по orderId",
        phone: "Телефон клиента",
        allStatuses: "Все статусы",
        outletId: "Outlet ID",
        courierId: "Courier ID",
        problematic: "Проблемные"
      },
      sort: {
        newest: "Новые сначала",
        oldest: "Старые сначала",
        problematic: "Сначала проблемные"
      },
      table: {
        orderId: "Номер заказа",
        date: "Дата",
        restaurant: "Ресторан",
        amount: "Сумма",
        status: "Статус",
        courier: "Курьер",
        phone: "Телефон",
        sla: "SLA",
        problems: "Проблемы",
        actions: "Действия",
        ok: "ок",
        client: "Клиент"
      },
      actions: {
        open: "Открыть заказ"
      },
      severity: {
        high: "Высокий",
        medium: "Средний",
        low: "Низкий"
      },
      overview: {
        details: "Детали заказа",
        related: "Связанные сущности",
        client: "Клиент",
        courier: "Курьер",
        restaurant: "Ресторан",
        address: "Адрес",
        created: "Создан"
      },
      support: {
        title: "Действия поддержки",
        actionsTitle: "Действия поддержки",
        cancelReason: "Причина отмены",
        cancelOrder: "Отменить заказ",
        reassignCourier: "Назначить курьера",
        courierId: "ID курьера",
        notifyClient: "Отправить уведомление",
        notifyPlaceholder: "Текст уведомления",
        notifyRequired: "Введите текст уведомления",
        notified: "Уведомление отправлено",
        resendRestaurant: "Переотправить в ресторан",
        resendConfirm: "Переотправить заказ в ресторан?",
        resendOk: "Заказ переотправлен",
        noAccess: "Недостаточно прав",
        cancelled: "Заказ отменен",
        reassigned: "Курьер назначен"
      },
      timeline: {
        noteRequired: "Требуется текст заметки",
        noteAdded: "Заметка добавлена",
        addNote: "Добавить заметку",
        notePlaceholder: "Что произошло?",
        saving: "Сохранение...",
        noEvents: "Событий пока нет",
        noProblems: "Проблемных флагов нет",
        problems: "Проблемы",
        system: "система",
        reason: "Причина",
        summary: {
          promisedAt: "Обещали доставить до",
          cookingMinutes: "Минуты на готовку",
          deliveryMinutes: "Минуты на доставку",
          delay: "Опоздание"
        },
        sla: {
          courierSearch: "Поиск курьера",
          cooking: "Готовка",
          waitingPickup: "Ожидание выдачи",
          delivery: "Доставка"
        },
        stages: {
          title: "Этапы",
          accepted: "Заказ принят",
          ready: "Готов к доставке",
          courierArrived: "Курьер прибыл в ресторан",
          pickedUp: "Курьер забрал заказ",
          courierArrivedClient: "Курьер прибыл к клиенту",
          delivered: "Доставлено",
          done: "Готово",
          pending: "Ожидается"
        },
        types: {
          created: "Заказ создан",
          accepted: "Принят заведением",
          cooking: "Начата готовка",
          ready: "Заказ готов",
          readyForPickup: "Готов к выдаче",
          courierSearch: "Поиск курьера",
          courierAssigned: "Курьер назначен",
          pickedUp: "Курьер забрал",
          outForDelivery: "В пути",
          delivered: "Доставлен",
          cancelled: "Отменен",
          refunded: "Возврат",
          note: "Заметка саппорта",
          compensation: "Компенсация выдана",
          cartUpdated: "Корзина изменена",
          notifyClient: "Уведомление клиенту",
          resendRestaurant: "Переотправлено в ресторан",
        }
      },
      details: {
        sentToRestaurant: "Отправлено в ресторан",
        promisedAt: "Обещанное время доставки",
        deliveredAt: "Фактическое время доставки",
        address: "Адрес доставки",
        addressComment: "Комментарий к адресу",
        entrance: "Подъезд",
        floor: "Этаж",
        apartment: "Квартира",
        recipient: "Получатель",
        forOther: "Заказ другому человеку",
        receiverName: "Имя получателя",
        receiverPhone: "Номер получателя",
        ordererPhone: "Номер заказчика",
        utensils: "Приборы",
        comments: "Комментарии",
        commentRestaurant: "Комментарий к ресторану",
        commentAddress: "Комментарий к адресу",
        commentCrm: "CRM-комментарий",
        payment: "Оплата",
        subtotalFood: "Стоимость блюд",
        deliveryFee: "Стоимость доставки",
        serviceFee: "Сервисный сбор",
        discount: "Скидка",
        promoCode: "Промокод",
        total: "Итоговая сумма",
        restaurantTotal: "Сумма для ресторана",
        items: "Состав заказа",
        itemsEmpty: "Позиции отсутствуют",
        itemsTable: {
          title: "Блюдо",
          quantity: "Кол-во",
          weight: "Вес",
          unitPrice: "Цена",
          total: "Итог",
          actions: "Действия",
          info: "Инфо",
          remove: "Удалить",
          add: "Добавить позицию"
        },
        itemDescription: "Описание",
        itemSku: "SKU",
        saveTitle: "Сохранение изменений",
        saveComment: "Комментарий к изменениям",
        saveCommentPlaceholder: "Опишите причину изменений",
        saveOrder: "Сохранить заказ",
        savePending: "Сохранение...",
        saveCommentRequired: "Комментарий обязателен",
        saveSuccess: "Заказ сохранен"
      },
      compensation: {
        reason: "Причина компенсации",
        reasonPlaceholder: "Опишите причину",
        mode: "Тип компенсации",
        amount: "Сумма",
        percent: "Процент",
        value: "Значение",
        valuePlaceholder: "Введите сумму или процент",
        comment: "Комментарий",
        commentPlaceholder: "Дополнительные детали",
        issue: "Выдать компенсацию",
        issued: "Компенсация оформлена",
        submitting: "Отправка...",
        required: "Укажите причину и сумму"
      },
      details: {
        sentToRestaurant: "Restoranga yuborildi",
        promisedAt: "Va'da qilingan yetkazish vaqti",
        deliveredAt: "Haqiqiy yetkazish vaqti",
        address: "Yetkazish manzili",
        addressComment: "Manzil izohi",
        entrance: "Kirish",
        floor: "Qavat",
        apartment: "Xonadon",
        recipient: "Qabul qiluvchi",
        forOther: "Boshqa odam uchun",
        receiverName: "Qabul qiluvchi ismi",
        receiverPhone: "Qabul qiluvchi telefoni",
        ordererPhone: "Buyurtmachi telefoni",
        utensils: "Anjomlar",
        comments: "Izohlar",
        commentRestaurant: "Restoranga izoh",
        commentAddress: "Manzilga izoh",
        commentCrm: "CRM-izoh",
        payment: "To'lov",
        subtotalFood: "Taomlar summasi",
        deliveryFee: "Yetkazish narxi",
        serviceFee: "Servis to'lovi",
        discount: "Chegirma",
        promoCode: "Promokod",
        total: "Yakuniy summa",
        restaurantTotal: "Restoran uchun summa",
        items: "Buyurtma tarkibi",
        itemsEmpty: "Pozitsiyalar yo'q",
        itemsTable: {
          title: "Taom",
          quantity: "Soni",
          weight: "Og'irlik",
          unitPrice: "Narx",
          total: "Jami",
          actions: "Amallar",
          info: "Info",
          remove: "O'chirish",
          add: "Pozitsiya qo'shish"
        },
        itemDescription: "Tavsif",
        itemSku: "SKU",
        saveTitle: "O'zgartirishlarni saqlash",
        saveComment: "O'zgarishlarga izoh",
        saveCommentPlaceholder: "O'zgarish sababini yozing",
        saveOrder: "Buyurtmani saqlash",
        savePending: "Saqlanmoqda...",
        saveCommentRequired: "Izoh majburiy",
        saveSuccess: "Buyurtma saqlandi"
      },
      compensation: {
        reason: "Kompensatsiya sababi",
        reasonPlaceholder: "Sababni yozing",
        mode: "Kompensatsiya turi",
        amount: "Summa",
        percent: "Foiz",
        value: "Qiymat",
        valuePlaceholder: "Summa yoki foiz kiriting",
        comment: "Izoh",
        commentPlaceholder: "Qo'shimcha ma'lumot",
        issue: "Kompensatsiya berish",
        issued: "Kompensatsiya berildi",
        submitting: "Yuborilmoqda...",
        required: "Sabab va summani kiriting"
      },
      details: {
        sentToRestaurant: "Sent to restaurant",
        promisedAt: "Promised delivery time",
        deliveredAt: "Actual delivery time",
        address: "Delivery address",
        addressComment: "Address comment",
        entrance: "Entrance",
        floor: "Floor",
        apartment: "Apartment",
        recipient: "Recipient",
        forOther: "Order for someone else",
        receiverName: "Recipient name",
        receiverPhone: "Recipient phone",
        ordererPhone: "Orderer phone",
        utensils: "Utensils",
        comments: "Comments",
        commentRestaurant: "Comment to restaurant",
        commentAddress: "Comment to address",
        commentCrm: "CRM comment",
        payment: "Payment",
        subtotalFood: "Food subtotal",
        deliveryFee: "Delivery fee",
        serviceFee: "Service fee",
        discount: "Discount",
        promoCode: "Promo code",
        total: "Total",
        restaurantTotal: "Restaurant total",
        items: "Order items",
        itemsEmpty: "No items yet",
        itemsTable: {
          title: "Item",
          quantity: "Qty",
          weight: "Weight",
          unitPrice: "Unit price",
          total: "Total",
          actions: "Actions",
          info: "Info",
          remove: "Remove",
          add: "Add item"
        },
        itemDescription: "Description",
        itemSku: "SKU",
        saveTitle: "Save changes",
        saveComment: "Change comment",
        saveCommentPlaceholder: "Describe the change reason",
        saveOrder: "Save order",
        savePending: "Saving...",
        saveCommentRequired: "Comment is required",
        saveSuccess: "Order saved"
      },
      compensation: {
        reason: "Compensation reason",
        reasonPlaceholder: "Describe the reason",
        mode: "Compensation type",
        amount: "Amount",
        percent: "Percent",
        value: "Value",
        valuePlaceholder: "Enter amount or percent",
        comment: "Comment",
        commentPlaceholder: "Additional details",
        issue: "Issue compensation",
        issued: "Compensation issued",
        submitting: "Submitting...",
        required: "Reason and value are required"
      }
    },
    clients: {
      profile: {
        eyebrow: "Профиль клиента",
        title: "Клиент",
        idLabel: "ID"
      },
      searchPlaceholder: "Поиск по имени или телефону",
      allStatuses: "Все статусы",
      table: {
        client: "Клиент",
        phone: "Телефон",
        orders: "Заказы",
        status: "Статус"
      },
      confirm: {
        blockTitle: "Заблокировать клиента?",
        unblockTitle: "Разблокировать клиента?",
        description: "Вы уверены, что хотите изменить статус клиента?"
      },
      prompts: {
        name: "Имя клиента",
        phone: "Телефон"
      },
      toasts: {
        updated: "Данные обновлены",
        statusUpdated: "Статус обновлен",
        noteAdded: "Заметка добавлена",
        noteDeleted: "Заметка удалена"
      },
      actions: {
        block: "Заблокировать",
        unblock: "Разблокировать",
        blockConfirm: "Заблокировать клиента?",
        unblockConfirm: "Разблокировать клиента?"
      },
      overview: {
        details: "Детали клиента",
        metrics: "Метрики",
        support: "Инструменты поддержки",
        primaryAddress: "Основной адрес",
        lastPromo: "Последний промокод",
        manageAddresses: "Управлять адресами",
        viewPromos: "Посмотреть промокоды"
      },
      metrics: {
        orders: "Заказы",
        totalSpent: "Потрачено всего",
        avgCheck: "Средний чек"
      },
      orders: {
        title: "История заказов",
        searchPlaceholder: "Поиск по orderId",
        allStatuses: "Все статусы"
      },
      notes: {
        title: "Заметки",
        note: "Заметка",
        placeholder: "Добавить заметку...",
        support: "саппорт"
      },
      addresses: {
        title: "Адреса",
        add: "Добавить адрес",
        edit: "Редактировать адрес",
        address: "Адрес",
        label: "Метка",
        entrance: "Подъезд",
        floor: "Этаж",
        apartment: "Квартира",
        comment: "Комментарий",
        primary: "Основной",
        setPrimary: "Сделать основным",
        none: "Адресов пока нет",
        required: "Адрес обязателен",
        saved: "Адрес сохранен",
        deleted: "Адрес удален",
        primaryUpdated: "Основной адрес обновлен",
        deleteTitle: "Удалить адрес?",
        deleteDescription: "Действие необратимо."
      },
      promos: {
        title: "Промокоды",
        issue: "Выдать промокод",
        none: "Промокодов нет",
        reasonRequired: "Укажите причину",
        valueRequired: "Укажите значение",
        issued: "Промокод выдан: {code}",
        copied: "Код скопирован",
        revokeTitle: "Отозвать промокод?",
        revokeDescription: "Промокод будет отозван сразу.",
        revoked: "Промокод отозван",
        copy: "Копировать",
        revoke: "Отозвать",
        table: {
          code: "Код",
          typeValue: "Тип/значение",
          status: "Статус",
          expires: "Истекает",
          reason: "Причина",
          issuedBy: "Кем выдан",
          issuedAt: "Дата выдачи",
          order: "Заказ",
          actions: "Действия"
        },
        form: {
          type: "Тип",
          value: "Значение",
          expires: "Истекает",
          minOrder: "Мин. сумма заказа",
          relatedOrder: "Связанный заказ",
          reason: "Причина"
        }
      }
    },
    couriers: {
      profile: {
        eyebrow: "Профиль курьера",
        title: "Курьер",
        idLabel: "ID"
      },
      status: {
        online: "онлайн",
        offline: "офлайн"
      },
      toasts: {
        updated: "?????? ??????? ?????????",
        statusUpdated: "Статус обновлен",
        noteAdded: "Заметка добавлена",
        noteDeleted: "Заметка удалена"
      },
      overview: {
        title: "Обзор"
      },
      fields: {
        fullName: "???",
        address: "?????",
        deliveryMethods: "??????? ????????",
        ratingCount: "?????????? ?????????",
        name: "Имя",
        phone: "Телефон",
        status: "Статус",
        online: "Онлайн",
        rating: "Рейтинг",
        createdAt: "Создан",
        updatedAt: "Обновлен"
      },
      methods: {
        walk: "??????",
        bike: "?????????",
        car: "???? / ????"
      },

      actions: {
        block: "Заблокировать",
        unblock: "Разблокировать",
        noAccess: "Недостаточно прав",
        blockConfirm: "Заблокировать курьера?",
        unblockConfirm: "Разблокировать курьера?",
        confirmDescription: "Статус обновится сразу после подтверждения."
      },
      filters: {
        allStatuses: "Все статусы",
        allBlocked: "Все"
      },
      table: {
        courier: "Курьер",
        phone: "Телефон",
        status: "Статус",
        rating: "Рейтинг",
        ordersToday: "Заказы сегодня",
        blocked: "Блокировка"
      },
      notes: {
        title: "Заметки",
        note: "Заметка",
        placeholder: "Добавить заметку...",
        support: "саппорт"
      }
    },
    partners: {
      profile: {
        eyebrow: "Профиль партнера",
        idLabel: "ID"
      },
      overview: {
        title: "Обзор"
      },
      fields: {
        name: "Название",
        manager: "Менеджер",
        contactName: "Ответственное лицо",
        email: "Email",
        phone1: "Телефон 1",
        phone2: "Телефон 2",
        phone3: "Телефон 3",
        outlets: "Точки",
        status: "Статус"
      },
      actions: {
        block: "Заблокировать",
        unblock: "Разблокировать",
        noAccess: "Недостаточно прав",
        blockConfirm: "Заблокировать партнера?",
        unblockConfirm: "Разблокировать партнера?",
        confirmDescription: "Статус обновится сразу после подтверждения."
      },
      toasts: {
        statusUpdated: "Статус обновлен",
        noteAdded: "Заметка добавлена",
        noteDeleted: "Заметка удалена"
      },
      searchPlaceholder: "Поиск партнера",
      allStatuses: "Все статусы",
      table: {
        partner: "Партнер",
        status: "Статус",
        outlets: "Точки",
        manager: "Менеджер"
      },
      notes: {
        title: "Заметки",
        note: "Заметка",
        placeholder: "Добавить заметку...",
        support: "саппорт"
      },
      finance: {
        summary: {
          turnover: "Оборот",
          commission: "Комиссии платформы",
          payouts: "Выплаты партнеру"
        }
      }
    },
    outlets: {
      profile: {
        eyebrow: "Профиль точки",
        idLabel: "ID"
      },
      overview: {
        title: "Обзор"
      },
      fields: {
        name: "Название",
        partner: "Партнер",
        type: "Тип",
        address: "Адрес",
        addressComment: "Комментарий к адресу",
        phone: "Телефон",
        email: "Email",
        status: "Статус",
        statusReason: "Причина статуса",
        hours: "Часы",
        deliveryZone: "Зона доставки"
      },
      actions: {
        activate: "Активировать",
        tempDisable: "Временно отключить",
        block: "Заблокировать",
        noAccess: "Недостаточно прав"
      },
      status: {
        open: "Открыта",
        closed: "Закрыта",
        blocked: "Заблокирована"
      },
      toasts: {
        statusUpdated: "Статус обновлен",
        noteAdded: "Заметка добавлена",
        noteDeleted: "Заметка удалена"
      },
      searchPlaceholder: "Поиск точки",
      filters: {
        partnerId: "ID партнера",
        allTypes: "Все типы",
        restaurant: "Ресторан",
        shop: "Магазин",
        allStatuses: "Все статусы"
      },
      confirm: {
        statusTitle: "Установить статус {status}?",
        statusDescription: "Статус будет обновлен сразу после подтверждения.",
        reasonPlaceholder: "Укажите причину отключения"
      },
      table: {
        outlet: "Точка",
        partner: "Партнер",
        address: "Адрес",
        status: "Статус",
        openClose: "Открыть/Закрыть",
        type: "Тип"
      },
      notes: {
        title: "Заметки",
        note: "Заметка",
        placeholder: "Добавить заметку...",
        support: "саппорт"
      },
      menu: {
        title: "Меню / Товары",
        addItem: "???????? ???????",
        createItem: "??????? ???????",
        search: "Поиск по названию или SKU",
        empty: "Товаров пока нет",
        sale: "СКИДКА",
        history: "История",
        enable: "Включить",
        disable: "Выключить",
        editItem: "Редактировать товар",
        priceHistory: "История цен",
        noHistory: "Истории нет",
        filters: {
          all: "Все",
          available: "Доступно",
          unavailable: "Недоступно"
        },
        sort: {
          titleAsc: "Название А-Я",
          titleDesc: "Название Я-А",
          priceLow: "Цена по возрастанию",
          priceHigh: "Цена по убыванию",
          updated: "Недавно обновлено"
        },
        table: {
          title: "Название",
          category: "Категория",
          sku: "SKU",
          weight: "???",
          photo: "????",
          photoLink: "???????",
          basePrice: "Базовая цена",
          currentPrice: "Текущая цена",
          availability: "Доступность",
          stock: "Остаток",
          updated: "Обновлено"
        },
        form: {
          title: "????????",
          category: "?????????",
          sku: "SKU",
          description: "????????",
          photoUrl: "???? (URL)",
          weight: "??? (?)",
          unavailableReason: "??????? ????-?????",
          unavailableUntil: "??????????????????",
          basePrice: "Базовая цена",
          stock: "Остаток",
          availability: "Доступность",
          reason: "Причина"
        },
        confirm: {
          available: "Сделать доступным?",
          unavailable: "Сделать недоступным?",
          description: "Доступность будет обновлена сразу.",
          deleteTitle: "??????? ????????",
          deleteDescription: "??????? ????? ??????? ?? ????."
        },
        toasts: {
          updated: "Товар обновлен",
          availabilityUpdated: "Доступность обновлена",
          created: "??????? ?????????",
          deleted: "??????? ???????"
        },
        prompts: {
          unavailableReason: "??????? ????-?????"
        },
        validation: {
          required: "???????? ? ???? ???????????",
          reasonRequired: "??????? ??????? ????-?????"
        },
        stoplist: {
          noReason: "??????? ?? ???????"
        },
        historyTable: {
          old: "Старая цена",
          new: "Новая цена",
          reason: "Причина",
          changedAt: "Изменено"
        }
      },
      campaigns: {
        title: "Кампании",
        create: "Создать кампанию",
        edit: "Редактировать кампанию",
        saved: "Кампания сохранена",
        activateTitle: "Активировать кампанию?",
        activateDescription: "Кампания станет активной сразу.",
        activated: "Кампания активирована",
        endTitle: "Завершить кампанию?",
        endDescription: "Кампания завершится сразу.",
        ended: "Кампания завершена",
        empty: "Кампаний пока нет",
        table: {
          title: "Название",
          status: "Статус",
          start: "Старт",
          end: "Окончание",
          items: "Товары"
        },
        itemsTitle: "Товары кампании",
        itemsEmpty: "Товаров пока нет",
        addItem: "Добавить товар",
        itemSaved: "Товар кампании сохранен",
        itemRemoved: "Товар удален",
        itemsRequired: "???????? ???? ?? ???? ???????",
        outletsRequired: "???????? ???? ?? ???? ?????",
        itemRemoveTitle: "Удалить товар из кампании?",
        itemRemoveDescription: "Товар будет удален сразу.",
        itemTitle: "Товар кампании",
        selectItem: "Выберите товар",
        selectItems: "???????? ???????",
        form: {
          title: "Название",
          start: "Старт",
          end: "Окончание",
          item: "Товар",
          discountType: "Тип скидки",
          discountValue: "Значение скидки",
          outlets: "?????",
          status: "??????",
          bundle: "???"
        },
        itemsTable: {
          item: "Товар",
          basePrice: "Базовая цена",
          discount: "Скидка",
          bundle: "???",
          resultPrice: "Цена по акции"
        },
        discount: {
          percent: "процент",
          fixed: "фикс",
          newPrice: "новая цена"
        },
        status: {
          planned: "?????????????",
          active: "???????",
          ended: "?????????"
        },
        remove: "Удалить"
      }
    },
    promos: {
      profile: {
        eyebrow: "Профиль промокода",
        idLabel: "ID"
      },
      toasts: {
        updated: "Промокод обновлен",
        created: "Промоакция создана"
      },
      filters: {
        search: "Поиск по коду",
        all: "Все"
      },
      table: {
        code: "Код",
        discount: "Скидка",
        outlets: "Точки",
        usage: "Использования",
        status: "Статус",
        allOutlets: "Все точки"
      },
      status: {
        active: "Активен",
        inactive: "Неактивен"
      },
      actions: {
        activate: "Активировать",
        deactivate: "Деактивировать",
        create: "Создать акцию",
        activateTitle: "Активировать промокод?",
        deactivateTitle: "Деактивировать промокод?",
        confirmDescription: "Статус будет обновлен сразу.",
        statusUpdated: "Статус обновлен"
      },
      form: {
        code: "Код",
        description: "Описание",
        discount: "Скидка %",
        maxUses: "Макс. использований",
        usedCount: "Использовано",
        active: "Активен",
        startsAt: "Начало",
        endsAt: "Окончание",
        minOrderAmount: "Мин. сумма заказа",
        outletId: "ID точки",
        outlets: "Точки",
        allOutlets: "Все точки",
        firstOrderOnly: "Только первый заказ"
      }
    },
    finance: {
      searchTitle: "Поиск по названию",
      allStatuses: "Все статусы",
      allTypes: "Все типы",
      outletId: "ID точки",
      partnerId: "ID партнера",
      export: "Экспорт CSV",
      total: "Итого",
      noData: "Данных пока нет",
      noExport: "Нет данных для экспорта",
      table: {
        title: "Назначение",
        amount: "Сумма",
        status: "Статус",
        type: "Тип",
        order: "Заказ",
        outlet: "Точка",
        partner: "Партнер",
        date: "Дата"
      },
      types: {
        commission: "Комиссия",
        courier_payout: "Выплата курьеру",
        penalty: "Штраф",
        payment: "Платеж",
        refund: "Возврат",
        bonus: "Бонус",
        service_fee: "Сервисный сбор",
        delivery_share: "Доля доставки"
      }
    },
    audit: {
      actor: "Актер",
      before: "До",
      after: "После",
      entities: {
        all: "Все сущности",
        user: "user",
        client: "client",
        courier: "courier",
        partner: "partner",
        outlet: "outlet",
        order: "order",
        promo: "promo"
      },
      filters: {
        actorId: "ID актера"
      },
      table: {
        entity: "Сущность",
        entityId: "ID сущности",
        action: "Действие",
        actor: "Актер",
        timestamp: "Время",
        diff: "Изменения"
      }
    },
    currency: {
      sum: "сум"
    }
  },
  uz: {
    app: {
      title: "Kungrad Admin",
      subtitle: "Qo'llab-quvvatlash uchun operatsion vositalar",
      language: "Til"
    },
    nav: {
      dashboard: "Dashboard",
      users: "Foydalanuvchilar",
      clients: "Mijozlar",
      partners: "Hamkorlar",
      outlets: "Shoxobchalar",
      couriers: "Kuryerlar",
      orders: "Buyurtmalar",
      finance: "Moliya",
      promos: "Promo kodlar",
      audit: "Audit"
    },
    common: {
      actions: "Amallar",
      add: "Qo'shish",
      apply: "Qo'llash",
      back: "Orqaga",
      cancel: "Bekor qilish",
      close: "Yopish",
      confirm: "Tasdiqlash",
      create: "Yaratish",
      delete: "O'chirish",
      edit: "Tahrirlash",
      next: "Keyingi",
      page: "{page} / {total} sahifa",
      role: "Rol",
      save: "Saqlash",
      search: "Qidirish",
      status: "Holat",
      view: "Ko'rish",
      yes: "Ha",
      no: "Yo'q"
    },
    auth: {
      title: "Admin panelga kirish",
      description: "Telegram ID va rolni kiriting.",
      tgId: "Telegram ID",
      tgPlaceholder: "Masalan: 123456789",
      role: "Rol",
      submit: "Kirish"
    },
    errors: {
      authRequired: "401: Avtorizatsiya talab qilinadi.",
      forbidden: "403: Kirish taqiqlangan.",
      notFoundUser: "404: Foydalanuvchi topilmadi.",
      notFoundClient: "404: Mijoz topilmadi.",
      server: "500: Server xatosi.",
      api401: "401: avtorizatsiya yo'q",
      api403: "403: huquqlar yetarli emas",
      api404: "404: topilmadi",
      api500: "500: server xatosi",
      apiUnknown: "Noma'lum xato",
      loadProfile: "Profil ma'lumotlarini yuklab bo'lmadi."
    },
    dashboard: {
      title: "Dashboard",
      description: "Asosiy ko'rsatkichlar va so'nggi voqealar.",
      recentOrders: "So'nggi buyurtmalar",
      table: {
        orderId: "Raqam",
        outlet: "Shoxobcha",
        status: "Holat"
      },
      cards: {
        ordersToday: "Bugungi buyurtmalar",
        activeCouriers: "Faol kuryerlar",
        newClients: "Yangi mijozlar",
        serviceFee: "Servis to'lovi"
      },
      problemOrders: "Muammoli buyurtmalar",
      quickLinks: "Tezkor havolalar",
      noData: "Hali ma'lumot yo'q",
      table2: {
        orderId: "Buyurtma ID",
        status: "Holat",
        outlet: "Shoxobcha",
        created: "Yaratilgan",
        actions: "Amallar",
        view: "Ochish"
      }
    },
    pages: {
      users: {
        title: "Foydalanuvchilar",
        description: "Telegram foydalanuvchilari va ularning holatlari.",
        filters: "Foydalanuvchi filtrlari",
        searchPlaceholder: "TG ID yoki username bo'yicha qidirish",
        allRoles: "Barcha rollar",
        allStatuses: "Barcha holatlar"
      },
      clients: {
        title: "Mijozlar",
        description: "Tez qidiruv va mijozlarni boshqarish."
      },
      partners: {
        title: "Hamkorlar",
        description: "Hamkorlar va shoxobchalar."
      },
      outlets: {
        title: "Shoxobchalar",
        description: "Savdo nuqtalari va menyu."
      },
      couriers: {
        title: "Kuryerlar",
        description: "Kuryerlar va ularning holatlarini boshqarish."
      },
      orders: {
        title: "Buyurtmalar",
        description: "Buyurtmalarni qidirish va boshqarish."
      },
      finance: {
        title: "Moliya",
        description: "Moliya ko'rinishi (faqat o'qish)."
      },
      promos: {
        title: "Promo kodlar",
        description: "Promo kampaniyalarni boshqarish."
      },
      audit: {
        title: "Audit",
        description: "O'zgarishlar va harakatlar tarixi."
      }
    },
    users: {
      table: {
        tgId: "TG ID",
        username: "Username",
        role: "Rol",
        status: "Holat",
        id: "ID",
      actions: "Amallar"
      },
      modals: {
        addTitle: "Foydalanuvchini qo'shish",
        updateTitle: "Foydalanuvchini yangilash",
        deleteTitle: "Foydalanuvchini o'chirish",
        create: "Foydalanuvchini yaratish",
        update: "Foydalanuvchini yangilash",
        delete: "Foydalanuvchini o'chirish",
        userId: "Foydalanuvchi ID",
        username: "Username",
        role: "Rol",
        status: "Holat",
        keep: "O'zgartirmaslik",
        irreversible: "Qaytarib bo'lmaydi."
      },
      overview: {
        title: "Asosiy ma'lumot",
        actions: "Amallar",
        changeUsername: "Username ni o'zgartirish",
        changeRole: "Rolni o'zgartirish",
        changeStatus: "Holatni o'zgartirish",
        chooseRole: "Rolni tanlang",
        onlyAdmin: "Faqat admin uchun",
        chooseStatus: "Holatni tanlang",
        unblock: "Blokdan chiqarish",
        block: "Bloklash",
        deleteUser: "Foydalanuvchini o'chirish",
        deleteWarning: "Qaytarib bo'lmaydi",
        deleteOnlyAdmin: "O'chirish faqat admin uchun"
      },
      orders: {
        title: "Buyurtmalar tarixi",
        searchPlaceholder: "OrderId bo'yicha qidirish",
        allStatuses: "Barcha holatlar",
        table: {
          datetime: "Sana/vaqt",
          outlet: "Restoran",
          amount: "Summa",
          status: "Holat",
          courier: "Kuryer",
        }
      },
      finance: {
        title: "Moliya",
        table: {
          transaction: "Tranzaksiya",
          amount: "Summa",
          status: "Holat",
          date: "Sana"
        },
        summary: {
          payments: "To'lovlar",
          refunds: "Qaytarishlar",
          promos: "Promolar"
        }
      },
      profile: {
        title: "Foydalanuvchi profili",
        eyebrow: "Foydalanuvchi profili",
        idLabel: "ID"
      },
      fields: {
        createdAt: "Yaratilgan",
        updatedAt: "Yangilangan",
        lastActive: "Oxirgi faollik"
      },
      toasts: {
        updated: "Foydalanuvchi yangilandi",
        deleted: "Foydalanuvchi o'chirildi"
      },
      audit: {
        title: "Audit"
      },
      activity: {
        title: "Faollik"
      }
    },
    status: {
      active: "Faol",
      blocked: "Bloklangan",
      paused: "Pauza",
      pending: "Kutilmoqda",
      completed: "Yakunlangan",
      accepted_by_system: "Tizim qabul qildi",
      accepted_by_restaurant: "Restoran qabul qildi",
      ready_for_pickup: "Olib ketishga tayyor",
      picked_up: "Kuryer oldi",
      delivered: "Yetkazildi"
    },
    roles: {
      admin: "admin",
      support: "support",
      operator: "operator",
      "read-only": "read-only",
      client: "client",
      courier: "courier",
      partner: "partner"
    },
    globalSearch: {
      placeholder: "tg_id, ism yoki orderId bo'yicha qidirish",
      loading: "Qidirilmoqda...",
      empty: "Hech narsa topilmadi",
      groups: {
        users: "Users",
        clients: "Clients",
        orders: "Orders"
      }
    },
    confirm: {
      title: "Amalni tasdiqlang",
      confirm: "Tasdiqlash",
      cancel: "Bekor qilish"
    },
    tabs: {
      overview: "Umumiy",
      orders: "Buyurtmalar",
      finance: "Moliya",
      activity: "Faollik",
      audit: "Audit",
      timeline: "Vaqt jadvali",
      addresses: "Manzillar",
      promos: "Promolar",
      notes: "Izohlar",
      outlets: "Shoxobchalar",
      menu: "Menyu / Mahsulotlar",
      campaigns: "Kampaniyalar"
    },
    orders: {
      profile: {
        title: "Buyurtma profili",
        description: "Buyurtma tafsilotlari, tarix va bog'liq ma'lumotlar.",
        eyebrow: "Buyurtma profili",
        idLabel: "ID"
      },
      filters: {
        searchOrder: "OrderId bo'yicha qidirish",
        phone: "Mijoz telefoni",
        allStatuses: "Barcha holatlar",
        outletId: "Shoxobcha ID",
        courierId: "Kuryer ID",
        problematic: "Muammoli buyurtmalar"
      },
      sort: {
        newest: "Yangi avval",
        oldest: "Eski avval",
        problematic: "Muammoli avval"
      },
      table: {
        orderId: "Buyurtma ID",
        date: "Sana",
        restaurant: "Restoran",
        amount: "Summa",
        status: "Holat",
        courier: "Kuryer",
        phone: "Telefon",
        sla: "SLA",
        problems: "Muammolar",
        actions: "Amallar",
        ok: "Ok",
        client: "Mijoz"
      },
      actions: {
        open: "Buyurtmani ochish"
      },
      severity: {
        high: "Yuqori",
        medium: "O'rta",
        low: "Past"
      },
      overview: {
        details: "Buyurtma tafsilotlari",
        related: "Bog'liq ma'lumotlar",
        client: "Mijoz",
        courier: "Kuryer",
        restaurant: "Restoran",
        address: "Manzil",
        created: "Yaratilgan"
      },
      support: {
        title: "Qo'llab-quvvatlash amallari",
        actionsTitle: "Qo'llab-quvvatlash amallari",
        cancelReason: "Bekor qilish sababi",
        cancelOrder: "Buyurtmani bekor qilish",
        reassignCourier: "Kuryerni qayta biriktirish",
        courierId: "Kuryer ID",
        notifyClient: "Mijozga xabar yuborish",
        notifyPlaceholder: "Xabar matni",
        notifyRequired: "Xabar matnini kiriting",
        notified: "Xabar yuborildi",
        resendRestaurant: "Restoranga qayta yuborish",
        resendConfirm: "Buyurtmani restoranga qayta yuborasizmi?",
        resendOk: "Buyurtma qayta yuborildi",
        noAccess: "Ruxsat yo'q",
        cancelled: "Buyurtma bekor qilindi",
        reassigned: "Kuryer qayta biriktirildi"
      },
      timeline: {
        noteRequired: "Izoh kerak",
        noteAdded: "Izoh qo'shildi",
        addNote: "Izoh qo'shish",
        notePlaceholder: "Izoh yozing...",
        saving: "Saqlanmoqda...",
        noEvents: "Hali voqealar yo'q",
        noProblems: "Muammo aniqlanmadi",
        problems: "Muammolar",
        system: "Tizim",
        reason: "Sabab",
        summary: {
          promisedAt: "Va'da qilingan vaqtgacha",
          cookingMinutes: "Pishirish daqiqalari",
          deliveryMinutes: "Yetkazish daqiqalari",
          delay: "Kechikish"
        },
        sla: {
          courierSearch: "Kuryer qidiruvi",
          cooking: "Pishirish",
          waitingPickup: "Olib ketishni kutish",
          delivery: "Yetkazib berish"
        },
        stages: {
          title: "Bosqichlar",
          accepted: "Buyurtma qabul qilindi",
          ready: "Yetkazishga tayyor",
          courierArrived: "Kuryer restoranga yetib keldi",
          pickedUp: "Kuryer buyurtmani oldi",
          courierArrivedClient: "Kuryer mijozga yetib keldi",
          delivered: "Yetkazildi",
          done: "Bajarildi",
          pending: "Kutilmoqda"
        },
        types: {
          created: "Buyurtma yaratildi",
          accepted: "Buyurtma qabul qilindi",
          cooking: "Pishirish",
          ready: "Buyurtma tayyor",
          readyForPickup: "Olib ketishga tayyor",
          courierSearch: "Kuryer qidirilmoqda",
          courierAssigned: "Kuryer biriktirildi",
          pickedUp: "Olib ketildi",
          outForDelivery: "Yetkazib berilmoqda",
          delivered: "Yetkazildi",
          cancelled: "Bekor qilindi",
          refunded: "Qaytarildi",
          note: "Qo'llab-quvvatlash izohi",
          compensation: "Kompensatsiya berildi",
          cartUpdated: "Savatcha o'zgartirildi",
          notifyClient: "Mijozga xabar yuborildi",
          resendRestaurant: "Restoranga qayta yuborildi",
        }
      },
      details: {
        sentToRestaurant: "Restoranga yuborildi",
        promisedAt: "Va'da qilingan yetkazish vaqti",
        deliveredAt: "Haqiqiy yetkazish vaqti",
        address: "Yetkazish manzili",
        addressComment: "Manzil izohi",
        entrance: "Kirish",
        floor: "Qavat",
        apartment: "Xonadon",
        recipient: "Qabul qiluvchi",
        forOther: "Boshqa odam uchun",
        receiverName: "Qabul qiluvchi ismi",
        receiverPhone: "Qabul qiluvchi telefoni",
        ordererPhone: "Buyurtmachi telefoni",
        utensils: "Anjomlar",
        comments: "Izohlar",
        commentRestaurant: "Restoranga izoh",
        commentAddress: "Manzilga izoh",
        commentCrm: "CRM-izoh",
        payment: "To'lov",
        subtotalFood: "Taomlar summasi",
        deliveryFee: "Yetkazish narxi",
        serviceFee: "Servis to'lovi",
        discount: "Chegirma",
        promoCode: "Promokod",
        total: "Yakuniy summa",
        restaurantTotal: "Restoran uchun summa",
        items: "Buyurtma tarkibi",
        itemsEmpty: "Pozitsiyalar yo'q",
        itemsTable: {
          title: "Taom",
          quantity: "Soni",
          weight: "Og'irlik",
          unitPrice: "Narx",
          total: "Jami",
          actions: "Amallar",
          info: "Info",
          remove: "O'chirish",
          add: "Pozitsiya qo'shish"
        },
        itemDescription: "Tavsif",
        itemSku: "SKU",
        saveTitle: "O'zgartirishlarni saqlash",
        saveComment: "O'zgarishlarga izoh",
        saveCommentPlaceholder: "O'zgarish sababini yozing",
        saveOrder: "Buyurtmani saqlash",
        savePending: "Saqlanmoqda...",
        saveCommentRequired: "Izoh majburiy",
        saveSuccess: "Buyurtma saqlandi"
      },
      compensation: {
        reason: "Kompensatsiya sababi",
        reasonPlaceholder: "Sababni yozing",
        mode: "Kompensatsiya turi",
        amount: "Summa",
        percent: "Foiz",
        value: "Qiymat",
        valuePlaceholder: "Summa yoki foiz kiriting",
        comment: "Izoh",
        commentPlaceholder: "Qo'shimcha ma'lumot",
        issue: "Kompensatsiya berish",
        issued: "Kompensatsiya berildi",
        submitting: "Yuborilmoqda...",
        required: "Sabab va summani kiriting"
      }
    },
    clients: {
      profile: {
        eyebrow: "Mijoz profili",
        title: "Mijoz",
        idLabel: "ID"
      },
      searchPlaceholder: "Ism yoki telefon bo'yicha qidirish",
      allStatuses: "Barcha holatlar",
      table: {
        client: "Mijoz",
        phone: "Telefon",
        orders: "Buyurtmalar",
        status: "Holat"
      },
      confirm: {
        blockTitle: "Mijozni bloklaysizmi?",
        unblockTitle: "Mijozni blokdan chiqarasizmi?",
        description: "Mijozga kirish cheklanadi. Davom etasizmi?"
      },
      prompts: {
        name: "Mijoz ismi",
        phone: "Telefon"
      },
      toasts: {
        updated: "Mijoz yangilandi",
        statusUpdated: "Holat yangilandi",
        noteAdded: "Izoh qo'shildi",
        noteDeleted: "Izoh o'chirildi"
      },
      actions: {
        block: "Mijozni bloklash",
        unblock: "Blokdan chiqarish",
        blockConfirm: "Mijozni bloklaysizmi?",
        unblockConfirm: "Mijozni blokdan chiqarasizmi?"
      },
      overview: {
        details: "Mijoz tafsilotlari",
        metrics: "Ko'rsatkichlar",
        support: "Qo'llab-quvvatlash amallari",
        primaryAddress: "Asosiy manzil",
        lastPromo: "So'nggi promo",
        manageAddresses: "Manzillarni boshqarish",
        viewPromos: "Promolarni ko'rish"
      },
      metrics: {
        orders: "Buyurtmalar",
        totalSpent: "Jami sarflangan",
        avgCheck: "O'rtacha chek"
      },
      orders: {
        title: "Buyurtmalar",
        searchPlaceholder: "OrderId bo'yicha qidirish",
        allStatuses: "Barcha holatlar"
      },
      notes: {
        title: "Izohlar",
        note: "Izoh",
        placeholder: "Izoh yozing...",
        support: "Qo'llab-quvvatlash izohi"
      },
      addresses: {
        title: "Manzillar",
        add: "Manzil qo'shish",
        edit: "Manzilni tahrirlash",
        address: "Manzil",
        label: "Yorliq",
        entrance: "Kirish",
        floor: "Qavat",
        apartment: "Xonadon",
        comment: "Izoh",
        primary: "Asosiy",
        setPrimary: "Asosiy qilib belgilash",
        none: "Hali manzil yo'q",
        required: "Manzil majburiy",
        saved: "Manzil saqlandi",
        deleted: "Manzil o'chirildi",
        primaryUpdated: "Asosiy manzil yangilandi",
        deleteTitle: "Manzilni o'chirasizmi?",
        deleteDescription: "Bu amalni qaytarib bo'lmaydi."
      },
      promos: {
        title: "Promolar",
        issue: "Promo berish",
        none: "Hali promo yo'q",
        reasonRequired: "Sabab majburiy",
        valueRequired: "Qiymat majburiy",
        issued: "Promo berildi",
        copied: "Kod nusxalandi",
        revokeTitle: "Promoni bekor qilasizmi?",
        revokeDescription: "Bu promo bekor qilinadi.",
        revoked: "Promo bekor qilindi",
        copy: "Kod nusxalash",
        revoke: "Bekor qilish",
        table: {
          code: "Kod",
          typeValue: "Turi / qiymati",
          status: "Holat",
          expires: "Amal qilish muddati",
          reason: "Sabab",
          issuedBy: "Kim berdi",
          issuedAt: "Berilgan sana",
          order: "Buyurtma",
          actions: "Amallar"
        },
        form: {
          type: "Turi",
          value: "Qiymat",
          expires: "Amal qilish muddati",
          minOrder: "Minimal buyurtma",
          relatedOrder: "Bog'liq buyurtma",
          reason: "Sabab"
        }
      }
    },
    couriers: {
      profile: {
        eyebrow: "Kuryer profili",
        title: "Kuryer",
        idLabel: "ID"
      },
      status: {
        online: "Onlayn",
        offline: "Oflayn"
      },
      toasts: {
        updated: "Kuryer ma'lumotlari yangilandi",
        statusUpdated: "Holat yangilandi",
        noteAdded: "Izoh qo'shildi",
        noteDeleted: "Izoh o'chirildi"
      },
      overview: {
        title: "Kuryer haqida"
      },
      fields: {
        fullName: "F.I.Sh.",
        address: "Manzil",
        deliveryMethods: "Yetkazish usullari",
        ratingCount: "Reytinglar soni",
        name: "Ism",
        phone: "Telefon",
        status: "Holat",
        online: "Onlayn",
        rating: "Reyting",
        createdAt: "Yaratilgan",
        updatedAt: "Yangilangan"
      },
      methods: {
        walk: "Piyoda",
        bike: "Velosiped",
        car: "Avto / moto"
      },
      actions: {
        block: "Kuryerni bloklash",
        unblock: "Blokdan chiqarish",
        noAccess: "Ruxsat yo'q",
        blockConfirm: "Kuryerni bloklaysizmi?",
        unblockConfirm: "Kuryerni blokdan chiqarasizmi?",
        confirmDescription: "Kuryer holati yangilanadi."
      },
      filters: {
        allStatuses: "Barcha holatlar",
        allBlocked: "Barcha bloklanganlar"
      },
      table: {
        courier: "Kuryer",
        phone: "Telefon",
        status: "Holat",
        rating: "Reyting",
        ordersToday: "Bugungi buyurtmalar",
        blocked: "Bloklangan"
      },
      notes: {
        title: "Izohlar",
        note: "Izoh",
        placeholder: "Izoh yozing...",
        support: "Qo'llab-quvvatlash izohi"
      }
    },
    partners: {
      profile: {
        eyebrow: "Hamkor profili",
        idLabel: "ID"
      },
      overview: {
        title: "Hamkor haqida"
      },
      fields: {
        name: "Nomi",
        manager: "Menejer",
        contactName: "Mas'ul shaxs",
        email: "Email",
        phone1: "Telefon 1",
        phone2: "Telefon 2",
        phone3: "Telefon 3",
        outlets: "Shoxobchalar",
        status: "Holat"
      },
      actions: {
        block: "Hamkorni bloklash",
        unblock: "Blokdan chiqarish",
        noAccess: "Ruxsat yo'q",
        blockConfirm: "Hamkorni bloklaysizmi?",
        unblockConfirm: "Hamkorni blokdan chiqarasizmi?",
        confirmDescription: "Hamkor holati yangilanadi."
      },
      toasts: {
        statusUpdated: "Holat yangilandi",
        noteAdded: "Izoh qo'shildi",
        noteDeleted: "Izoh o'chirildi"
      },
      searchPlaceholder: "Nomi yoki menejer bo'yicha qidirish",
      allStatuses: "Barcha holatlar",
      table: {
        partner: "Hamkor",
        status: "Holat",
        outlets: "Shoxobchalar",
        manager: "Menejer"
      },
      notes: {
        title: "Izohlar",
        note: "Izoh",
        placeholder: "Izoh yozing...",
        support: "Qo'llab-quvvatlash izohi"
      },
      finance: {
        summary: {
          turnover: "Aylanma",
          commission: "Platforma komissiyasi",
          payouts: "Hamkorga to'lovlar"
        }
      }
    },
    outlets: {
      profile: {
        eyebrow: "Shoxobcha profili",
        idLabel: "ID"
      },
      overview: {
        title: "Shoxobcha haqida"
      },
      fields: {
        name: "Nomi",
        partner: "Hamkor",
        type: "Turi",
        address: "Manzil",
        addressComment: "Manzil izohi",
        phone: "Telefon",
        email: "Email",
        status: "Holat",
        statusReason: "Holat sababi",
        hours: "Ish vaqti",
        deliveryZone: "Yetkazib berish hududi"
      },
      actions: {
        activate: "Faollashtirish",
        tempDisable: "Vaqtinchalik o'chirish",
        block: "Shoxobchani bloklash",
        noAccess: "Ruxsat yo'q"
      },
      status: {
        open: "Ochiq",
        closed: "Yopiq",
        blocked: "Bloklangan"
      },
      toasts: {
        statusUpdated: "Holat yangilandi",
        noteAdded: "Izoh qo'shildi",
        noteDeleted: "Izoh o'chirildi"
      },
      searchPlaceholder: "Nomi yoki manzil bo'yicha qidirish",
      filters: {
        partnerId: "Hamkor ID",
        allTypes: "Barcha turlar",
        restaurant: "Restoran",
        shop: "Do'kon",
        allStatuses: "Barcha holatlar"
      },
      confirm: {
        statusTitle: "Shoxobcha holatini o'zgartirasizmi?",
        statusDescription: "Shoxobcha holati yangilanadi.",
        reasonPlaceholder: "O'chirish sababini kiriting"
      },
      table: {
        outlet: "Shoxobcha",
        partner: "Hamkor",
        address: "Manzil",
        status: "Holat",
        openClose: "Ochilish/yopilish",
        type: "Turi"
      },
      notes: {
        title: "Izohlar",
        note: "Izoh",
        placeholder: "Izoh yozing...",
        support: "Qo'llab-quvvatlash izohi"
      },
      menu: {
        title: "Menyu",
        addItem: "Pozitsiya qo'shish",
        createItem: "Pozitsiya yaratish",
        search: "Mahsulotlarni qidirish",
        empty: "Mahsulotlar yo'q",
        sale: "Chegirma",
        history: "Narx tarixi",
        enable: "Yoqish",
        disable: "O'chirish",
        editItem: "Mahsulotni tahrirlash",
        priceHistory: "Narx tarixi",
        noHistory: "Tarix yo'q",
        filters: {
          all: "Barchasi",
          available: "Mavjud",
          unavailable: "Mavjud emas"
        },
        sort: {
          titleAsc: "Nomi A-Z",
          titleDesc: "Nomi Z-A",
          priceLow: "Arzonidan qimmatiga",
          priceHigh: "Qimmatidan arzoniga",
          updated: "So'nggi yangilangan"
        },
        table: {
          title: "Mahsulot",
          category: "Kategoriya",
          sku: "SKU",
          weight: "Og'irlik",
          photo: "Rasm",
          photoLink: "Ochish",
          basePrice: "Asosiy narx",
          currentPrice: "Joriy narx",
          availability: "Mavjudligi",
          stock: "Qoldiq",
          updated: "Yangilangan"
        },
        form: {
          title: "Nomi",
          category: "Kategoriya",
          sku: "SKU",
          description: "Tavsif",
          photoUrl: "Rasm (URL)",
          weight: "Og'irlik (g)",
          unavailableReason: "Stop-list sababi",
          unavailableUntil: "Avto tiklash",
          basePrice: "Asosiy narx",
          stock: "Qoldiq",
          availability: "Mavjudligi",
          reason: "Sabab"
        },
        confirm: {
          available: "Mavjud qilib belgilaysizmi?",
          unavailable: "Mavjud emas qilib belgilaysizmi?",
          description: "Mahsulot mavjudligi yangilanadi.",
          deleteTitle: "Pozitsiya o'chirilsinmi?",
          deleteDescription: "Pozitsiya menyudan o'chiriladi."
        },
        toasts: {
          updated: "Mahsulot yangilandi",
          availabilityUpdated: "Mavjudlik yangilandi",
          created: "Pozitsiya qo'shildi",
          deleted: "Pozitsiya o'chirildi"
        },
        prompts: {
          unavailableReason: "Stop-list sababi"
        },
        validation: {
          required: "Nomi va narxi majburiy",
          reasonRequired: "Stop-list sababini kiriting"
        },
        stoplist: {
          noReason: "Sabab ko'rsatilmagan"
        },
        historyTable: {
          old: "Eski narx",
          new: "Yangi narx",
          reason: "Sabab",
          changedAt: "O'zgargan sana"
        }
      },
      campaigns: {
        title: "Kampaniyalar",
        create: "Kampaniya yaratish",
        edit: "Kampaniyani tahrirlash",
        saved: "Kampaniya saqlandi",
        activateTitle: "Kampaniyani faollashtirasizmi?",
        activateDescription: "Kampaniya faollashadi.",
        activated: "Kampaniya faollashdi",
        endTitle: "Kampaniyani yakunlaysizmi?",
        endDescription: "Kampaniya yakunlanadi.",
        ended: "Kampaniya yakunlandi",
        empty: "Kampaniyalar yo'q",
        table: {
          title: "Nomi",
          status: "Holat",
          start: "Boshlanish",
          end: "Tugash",
          items: "Mahsulotlar"
        },
        itemsTitle: "Kampaniya mahsulotlari",
        itemsEmpty: "Mahsulotlar yo'q",
        addItem: "Mahsulot qo'shish",
        itemSaved: "Mahsulot saqlandi",
        itemRemoved: "Mahsulot olib tashlandi",
        itemsRequired: "Kamida bitta pozitsiyani tanlang",
        outletsRequired: "Kamida bitta shoxobchani tanlang",
        itemRemoveTitle: "Mahsulotni olib tashlaysizmi?",
        itemRemoveDescription: "Mahsulot kampaniyadan olib tashlanadi.",
        itemTitle: "Mahsulot",
        selectItem: "Mahsulot tanlang",
        selectItems: "Pozitsiyalarni tanlang",
        form: {
          title: "Nomi",
          start: "Boshlanish",
          end: "Tugash",
          item: "Mahsulot",
          discountType: "Chegirma turi",
          discountValue: "Chegirma qiymati",
          outlets: "Shoxobchalar",
          status: "Holat",
          bundle: "Set"
        },
        itemsTable: {
          item: "Mahsulot",
          basePrice: "Asosiy narx",
          discount: "Chegirma",
          bundle: "Set",
          resultPrice: "Natijaviy narx"
        },
        discount: {
          percent: "Foiz",
          fixed: "Fiks",
          newPrice: "Yangi narx"
        },
        status: {
          planned: "Rejalashtirilgan",
          active: "Faol",
          ended: "Tugagan"
        },
        remove: "Olib tashlash"
      }
    },
    promos: {
      profile: {
        eyebrow: "Promo profili",
        idLabel: "ID"
      },
      toasts: {
        updated: "Promo yangilandi",
        created: "Promo yaratildi"
      },
      filters: {
        search: "Qidirish",
        all: "Barcha holatlar"
      },
      table: {
        code: "Kod",
        discount: "Chegirma",
        outlets: "Shoxobchalar",
        usage: "Foydalanish",
        status: "Holat",
        allOutlets: "Barcha shoxobchalar"
      },
      status: {
        active: "Faol",
        inactive: "Nofaol"
      },
      actions: {
        activate: "Faollashtirish",
        deactivate: "O'chirish",
        create: "Aksiya yaratish",
        activateTitle: "Promoni faollashtirasizmi?",
        deactivateTitle: "Promoni o'chirasizmi?",
        confirmDescription: "Promo holati yangilanadi.",
        statusUpdated: "Holat yangilandi"
      },
      form: {
        code: "Kod",
        description: "Tavsif",
        discount: "Chegirma",
        maxUses: "Maksimal foydalanish",
        usedCount: "Foydalanilgan",
        active: "Faol",
        startsAt: "Boshlanish sanasi",
        endsAt: "Tugash sanasi",
        minOrderAmount: "Minimal buyurtma summasi",
        outletId: "Shoxobcha ID",
        outlets: "Shoxobchalar",
        allOutlets: "Barcha shoxobchalar",
        firstOrderOnly: "Faqat birinchi buyurtma"
      }
    },
    finance: {
      searchTitle: "Qidirish",
      allStatuses: "Barcha holatlar",
      allTypes: "Barcha turlar",
      outletId: "Shoxobcha ID",
      partnerId: "Hamkor ID",
      export: "Eksport",
      total: "Jami",
      noData: "Ma'lumot yo'q",
      noExport: "Eksport uchun ma'lumot yo'q",
      table: {
        title: "Nomi",
        amount: "Summa",
        status: "Holat",
        type: "Turi",
        order: "Buyurtma",
        outlet: "Shoxobcha",
        partner: "Hamkor",
        date: "Sana"
      },
      types: {
        commission: "Komissiya",
        courier_payout: "Kuryer to'lovi",
        penalty: "Jarima",
        payment: "To'lov",
        refund: "Qaytarish",
        bonus: "Bonus",
        service_fee: "Servis to'lovi",
        delivery_share: "Yetkazib berish ulushi"
      }
    },
    audit: {
      actor: "Ijrochi",
      before: "Oldin",
      after: "Keyin",
      entities: {
        all: "Barchasi",
        user: "Foydalanuvchi",
        client: "Mijoz",
        courier: "Kuryer",
        partner: "Hamkor",
        outlet: "Shoxobcha",
        order: "Buyurtma",
        promo: "Promo"
      },
      filters: {
        actorId: "Ijrochi ID"
      },
      table: {
        entity: "Obyekt",
        entityId: "Obyekt ID",
        action: "Amal",
        actor: "Ijrochi",
        timestamp: "Sana/vaqt",
        diff: "Farq"
      }
    },
    currency: {
      sum: "so'm"
    }
  },
  kaa: {
    app: {
      title: "Kungrad Admin",
      subtitle: "Kómak qılıw ushın operatsiyalıq quraldar",
      language: "Til"
    },
    nav: {
      dashboard: "Dashboard",
      users: "Paydalaniwshılar",
      clients: "Klientler",
      partners: "Partnyorlar",
      outlets: "Noktalár",
      couriers: "Kuryerler",
      orders: "Buyırtpalar",
      finance: "Finans",
      promos: "Promokodlar",
      audit: "Audit"
    },
    common: {
      actions: "Ámeller",
      add: "Qosıw",
      apply: "Qollanıw",
      back: "Arqa",
      cancel: "Biykar etiw",
      close: "Jabıw",
      confirm: "Tastıyqlaw",
      create: "Jaratiw",
      delete: "Óshiriw",
      edit: "Ózgertiw",
      next: "Keyingi",
      page: "{page} / {total} bet",
      role: "Ról",
      save: "Saqtaw",
      search: "Izlew",
      status: "Hálat",
      view: "Kóriw",
      yes: "Áwa",
      no: "Jo'q"
    },
    auth: {
      title: "Admin panelge kiriw",
      description: "Telegram ID hám rólni kiritin.",
      tgId: "Telegram ID",
      tgPlaceholder: "Mısal: 123456789",
      role: "Ról",
      submit: "Kiriw"
    },
    errors: {
      authRequired: "401: Avtorizatsiya kerek.",
      forbidden: "403: Kiris tıyılǵan.",
      notFoundUser: "404: Paydalaniwshı tabılmadı.",
      notFoundClient: "404: Klient tabılmadı.",
      server: "500: Server qáteligi.",
      api401: "401: avtorizatsiya jo'q",
      api403: "403: ruxsat jetispeydi",
      api404: "404: tabılmadı",
      api500: "500: server qáteligi",
      apiUnknown: "Belgisiz qáte",
      loadProfile: "Profil maǵlıwmatın júklew múmkin bolmadı."
    },
    dashboard: {
      title: "Dashboard",
      description: "Negizgi kórsetkishler hám sońǵı waqıalar.",
      recentOrders: "Sońǵı buyırtpalar",
      table: {
        orderId: "Nomer",
        outlet: "Nokta",
        status: "Hálat"
      },
      cards: {
        ordersToday: "Búgingi buyırtpalar",
        activeCouriers: "Faol kuryerler",
        newClients: "Jańa klientler",
        serviceFee: "Servis jıynı"
      },
      problemOrders: "Problemalı buyırtpalar",
      quickLinks: "Tez havolalar",
      noData: "Házirshe maǵlıwmat jo'q",
      table2: {
        orderId: "Buyırtpa ID",
        status: "Hálat",
        outlet: "Nokta",
        created: "Jaralǵan",
        actions: "Ámeller",
        view: "Aşıw"
      }
    },
    pages: {
      users: {
        title: "Paydalaniwshılar",
        description: "Telegram paydalaniwshıları hám olardıń hálları.",
        filters: "Paydalaniwshı filtrlari",
        searchPlaceholder: "TG ID yaki username boyınsha izlew",
        allRoles: "Bárlıq roller",
        allStatuses: "Bárlıq haller"
      },
      clients: {
        title: "Klientler",
        description: "Tez izlew hám klientlerdi basqarıw."
      },
      partners: {
        title: "Partnyorlar",
        description: "Partnyorlar hám noktalár."
      },
      outlets: {
        title: "Noktalár",
        description: "Satuw noqtaları hám menú."
      },
      couriers: {
        title: "Kuryerler",
        description: "Kuryerler hám olardıń hálların basqarıw."
      },
      orders: {
        title: "Buyırtpalar",
        description: "Buyırtpalardı izlew hám basqarıw."
      },
      finance: {
        title: "Finans",
        description: "Finanslı ko‘rinis (tek oqiw)."
      },
      promos: {
        title: "Promokodlar",
        description: "Promo kampaniyalardı basqarıw."
      },
      audit: {
        title: "Audit",
        description: "Ózgerisler hám is-áreketler tariyxı."
      }
    },
    users: {
      table: {
        tgId: "TG ID",
        username: "Username",
        role: "Ról",
        status: "Hálat",
        id: "ID",
        actions: "Ámeller"
      },
      modals: {
        addTitle: "Paydalaniwshı qosıw",
        updateTitle: "Paydalaniwshını jańalaw",
        deleteTitle: "Paydalaniwshını óshiriw",
        create: "Paydalaniwshı jaratıw",
        update: "Paydalaniwshını jańalaw",
        delete: "Paydalaniwshını óshiriw",
        userId: "Paydalaniwshı ID",
        username: "Username",
        role: "Ról",
        status: "Hálat",
        keep: "Ózgertpew",
        irreversible: "Qaytarıw múmkin emes."
      },
      overview: {
        title: "Negizgi maǵlıwmat",
        actions: "Ámeller",
        changeUsername: "Username ózgertiw",
        changeRole: "Róldi ózgertiw",
        chooseRole: "Róldi tańlań",
        onlyAdmin: "Tek admin ushın",
        chooseStatus: "Hálattı tańlań",
        deleteUser: "Paydalaniwshını óshiriw",
        deleteWarning: "Qaytarıw múmkin emes",
        deleteOnlyAdmin: "Óshiriw tek admin ushın"
      },
      orders: {
        title: "Buyırtpalar tariyxı",
        searchPlaceholder: "OrderId boyınsha izlew",
        allStatuses: "Bárlıq haller",
        table: {
          datetime: "Sáni/waqıt",
          outlet: "Restoran",
          amount: "Somma",
          status: "Hálat",
          courier: "Kuryer",
        }
      },
      finance: {
        title: "Finans",
        table: {
          transaction: "Tranzaksiya",
          amount: "Somma",
          status: "Hálat",
          date: "Sana"
        }
      },
      audit: {
        title: "Audit"
      },
      activity: {
        title: "Bel sende"
      }
    },
    status: {
      active: "Faol",
      blocked: "Bloklandı",
      paused: "Pauza",
      pending: "Kútilmekte",
      completed: "Tamamlandı",
      accepted_by_system: "Sistema qabılladı",
      accepted_by_restaurant: "Restoran qabılladı",
      ready_for_pickup: "Alıwǵa tayın",
      picked_up: "Kuryer aldı",
      delivered: "Jetkizildi"
    },
    roles: {
      admin: "admin",
      support: "support",
      operator: "operator",
      "read-only": "read-only",
      client: "client",
      courier: "courier",
      partner: "partner"
    },
    globalSearch: {
      placeholder: "tg_id, atı yaki orderId boyınsha izlew",
      loading: "Izlew ketip atır...",
      empty: "Hésh nárse tabılmadı",
      groups: {
        users: "Users",
        clients: "Clients",
        orders: "Orders"
      }
    },
    confirm: {
      title: "Ámeldi tastıyqlań",
      confirm: "Tastıyqlaw",
      cancel: "Biykar etiw"
    }
  },
  en: {
    app: {
      title: "Kungrad Admin",
      subtitle: "Operational tools for support",
      language: "Language"
    },
    nav: {
      dashboard: "Dashboard",
      users: "Users",
      clients: "Clients",
      partners: "Partners",
      outlets: "Outlets",
      couriers: "Couriers",
      orders: "Orders",
      finance: "Finance",
      promos: "Promos",
      audit: "Audit"
    },
    common: {
      actions: "Actions",
      add: "Add",
      apply: "Apply",
      back: "Back",
      cancel: "Cancel",
      close: "Close",
      confirm: "Confirm",
      create: "Create",
      delete: "Delete",
      edit: "Edit",
      next: "Next",
      page: "Page {page} of {total}",
      role: "Role",
      save: "Save",
      search: "Search",
      status: "Status",
      view: "View",
      yes: "Yes",
      no: "No"
    },
    auth: {
      title: "Admin login",
      description: "Enter Telegram ID and access role.",
      tgId: "Telegram ID",
      tgPlaceholder: "For example: 123456789",
      role: "Role",
      submit: "Sign in"
    },
    errors: {
      authRequired: "401: Authorization required.",
      forbidden: "403: Access denied.",
      notFoundUser: "404: User not found.",
      notFoundClient: "404: Client not found.",
      server: "500: Server error.",
      api401: "401: unauthorized",
      api403: "403: insufficient permissions",
      api404: "404: not found",
      api500: "500: server error",
      apiUnknown: "Unknown error",
      loadProfile: "Failed to load profile data."
    },
    dashboard: {
      title: "Dashboard",
      description: "Key metrics and recent platform activity.",
      recentOrders: "Recent orders",
      table: {
        orderId: "Order",
        outlet: "Outlet",
        status: "Status"
      },
      cards: {
        ordersToday: "Orders today",
        activeCouriers: "Active couriers",
        newClients: "New clients",
        serviceFee: "Service fee"
      },
      problemOrders: "Problem orders",
      quickLinks: "Quick links",
      noData: "No data yet",
      table2: {
        orderId: "Order ID",
        status: "Status",
        outlet: "Outlet",
        created: "Created",
        actions: "Actions",
        view: "View"
      }
    },
    pages: {
      users: {
        title: "Users",
        description: "Telegram users and their statuses.",
        filters: "User filters",
        searchPlaceholder: "Search by TG ID or username",
        allRoles: "All roles",
        allStatuses: "All statuses"
      },
      clients: {
        title: "Clients",
        description: "Quick search and client management."
      },
      partners: {
        title: "Partners",
        description: "Partners and outlets."
      },
      outlets: {
        title: "Outlets",
        description: "Sales points and menu."
      },
      couriers: {
        title: "Couriers",
        description: "Courier management and statuses."
      },
      orders: {
        title: "Orders",
        description: "Search and manage orders."
      },
      finance: {
        title: "Finance",
        description: "Financial overview (read-only)."
      },
      promos: {
        title: "Promos",
        description: "Manage promo campaigns."
      },
      audit: {
        title: "Audit",
        description: "History of changes and actions."
      }
    },
    users: {
      table: {
        tgId: "TG ID",
        username: "Username",
        role: "Role",
        status: "Status",
        id: "ID",
      actions: "Actions"
      },
      modals: {
        addTitle: "Add user",
        updateTitle: "Update user",
        deleteTitle: "Delete user",
        create: "Create user",
        update: "Update user",
        delete: "Delete user",
        userId: "User ID",
        username: "Username",
        role: "Role",
        status: "Status",
        keep: "Keep",
        irreversible: "This action is irreversible."
      },
      overview: {
        title: "Primary info",
        actions: "Actions",
        changeUsername: "Change username",
        changeRole: "Change role",
        changeStatus: "Change status",
        chooseRole: "Choose role",
        onlyAdmin: "Admin only",
        chooseStatus: "Choose status",
        unblock: "Unblock user",
        block: "Block user",
        deleteUser: "Delete user",
        deleteWarning: "This action is irreversible",
        deleteOnlyAdmin: "Deletion is admin-only"
      },
      orders: {
        title: "Order history",
        searchPlaceholder: "Search by orderId",
        allStatuses: "All statuses",
        table: {
          datetime: "Date/time",
          outlet: "Restaurant",
          amount: "Amount",
          status: "Status",
          courier: "Courier",
        }
      },
      finance: {
        title: "Finance",
        table: {
          transaction: "Transaction",
          amount: "Amount",
          status: "Status",
          date: "Date"
        },
        summary: {
          payments: "Payments",
          refunds: "Refunds",
          promos: "Promos"
        }
      },
      profile: {
        title: "User profile",
        eyebrow: "User profile",
        idLabel: "ID"
      },
      fields: {
        createdAt: "Created",
        updatedAt: "Updated",
        lastActive: "Last active"
      },
      toasts: {
        updated: "User updated",
        deleted: "User deleted"
      },
      audit: {
        title: "Audit"
      },
      activity: {
        title: "Activity"
      }
    },
    status: {
      active: "Active",
      blocked: "Blocked",
      paused: "Paused",
      pending: "Pending",
      completed: "Completed",
      accepted_by_system: "Accepted by system",
      accepted_by_restaurant: "Accepted by restaurant",
      ready_for_pickup: "Ready for pickup",
      picked_up: "Picked up",
      delivered: "Delivered"
    },
    roles: {
      admin: "admin",
      support: "support",
      operator: "operator",
      "read-only": "read-only",
      client: "client",
      courier: "courier",
      partner: "partner"
    },
    globalSearch: {
      placeholder: "Search by tg_id, name, or orderId",
      loading: "Searching...",
      empty: "No results",
      groups: {
        users: "Users",
        clients: "Clients",
        orders: "Orders"
      }
    },
    confirm: {
      title: "Confirm action",
      confirm: "Confirm",
      cancel: "Cancel"
    },
    tabs: {
      overview: "Overview",
      orders: "Orders",
      finance: "Finance",
      activity: "Activity",
      audit: "Audit",
      timeline: "Timeline",
      addresses: "Addresses",
      promos: "Promos",
      notes: "Notes",
      outlets: "Outlets",
      menu: "Menu / Products",
      campaigns: "Campaigns"
    },
    orders: {
      profile: {
        title: "Order profile",
        description: "Order details, history, and related entities.",
        eyebrow: "Order profile",
        idLabel: "ID"
      },
      filters: {
        searchOrder: "Search by orderId",
        phone: "Client phone",
        allStatuses: "All statuses",
        outletId: "Outlet ID",
        courierId: "Courier ID",
        problematic: "Problem orders"
      },
      sort: {
        newest: "Newest first",
        oldest: "Oldest first",
        problematic: "Problematic first"
      },
      table: {
        orderId: "Order ID",
        date: "Date",
        restaurant: "Restaurant",
        amount: "Amount",
        status: "Status",
        courier: "Courier",
        phone: "Phone",
        sla: "SLA",
        problems: "Problems",
        actions: "Actions",
        ok: "Ok",
        client: "Client"
      },
      actions: {
        open: "Open order"
      },
      severity: {
        high: "High",
        medium: "Medium",
        low: "Low"
      },
      overview: {
        details: "Order details",
        related: "Related entities",
        client: "Client",
        courier: "Courier",
        restaurant: "Restaurant",
        address: "Address",
        created: "Created"
      },
      support: {
        title: "Support actions",
        actionsTitle: "Support actions",
        cancelReason: "Cancellation reason",
        cancelOrder: "Cancel order",
        reassignCourier: "Reassign courier",
        courierId: "Courier ID",
        notifyClient: "Notify client",
        notifyPlaceholder: "Message text",
        notifyRequired: "Enter a message",
        notified: "Notification sent",
        resendRestaurant: "Resend to restaurant",
        resendConfirm: "Resend order to restaurant?",
        resendOk: "Order resent",
        noAccess: "No access",
        cancelled: "Order cancelled",
        reassigned: "Courier reassigned"
      },
      timeline: {
        noteRequired: "Note is required",
        noteAdded: "Note added",
        addNote: "Add note",
        notePlaceholder: "Write a note...",
        saving: "Saving...",
        noEvents: "No events yet",
        noProblems: "No problems detected",
        problems: "Problems",
        system: "System",
        reason: "Reason",
        summary: {
          promisedAt: "Promised by",
          cookingMinutes: "Cooking minutes",
          deliveryMinutes: "Delivery minutes",
          delay: "Delay"
        },
        sla: {
          courierSearch: "Courier search",
          cooking: "Cooking",
          waitingPickup: "Waiting for pickup",
          delivery: "Delivery"
        },
        stages: {
          title: "Stages",
          accepted: "Order accepted",
          ready: "Ready for delivery",
          courierArrived: "Courier arrived at restaurant",
          pickedUp: "Courier picked up order",
          courierArrivedClient: "Courier arrived at client",
          delivered: "Delivered",
          done: "Done",
          pending: "Pending"
        },
        types: {
          created: "Order created",
          accepted: "Order accepted",
          cooking: "Cooking",
          ready: "Order ready",
          readyForPickup: "Ready for pickup",
          courierSearch: "Searching for courier",
          courierAssigned: "Courier assigned",
          pickedUp: "Picked up",
          outForDelivery: "Out for delivery",
          delivered: "Delivered",
          cancelled: "Cancelled",
          refunded: "Refunded",
          note: "Support note",
          compensation: "Compensation issued",
          cartUpdated: "Cart updated",
          notifyClient: "Client notified",
          resendRestaurant: "Resent to restaurant",
        }
      },
      details: {
        sentToRestaurant: "Sent to restaurant",
        promisedAt: "Promised delivery time",
        deliveredAt: "Actual delivery time",
        address: "Delivery address",
        addressComment: "Address comment",
        entrance: "Entrance",
        floor: "Floor",
        apartment: "Apartment",
        recipient: "Recipient",
        forOther: "Order for someone else",
        receiverName: "Recipient name",
        receiverPhone: "Recipient phone",
        ordererPhone: "Orderer phone",
        utensils: "Utensils",
        comments: "Comments",
        commentRestaurant: "Comment to restaurant",
        commentAddress: "Comment to address",
        commentCrm: "CRM comment",
        payment: "Payment",
        subtotalFood: "Food subtotal",
        deliveryFee: "Delivery fee",
        serviceFee: "Service fee",
        discount: "Discount",
        promoCode: "Promo code",
        total: "Total",
        restaurantTotal: "Restaurant total",
        items: "Order items",
        itemsEmpty: "No items yet",
        itemsTable: {
          title: "Item",
          quantity: "Qty",
          weight: "Weight",
          unitPrice: "Unit price",
          total: "Total",
          actions: "Actions",
          info: "Info",
          remove: "Remove",
          add: "Add item"
        },
        itemDescription: "Description",
        itemSku: "SKU",
        saveTitle: "Save changes",
        saveComment: "Change comment",
        saveCommentPlaceholder: "Describe the change reason",
        saveOrder: "Save order",
        savePending: "Saving...",
        saveCommentRequired: "Comment is required",
        saveSuccess: "Order saved"
      },
      compensation: {
        reason: "Compensation reason",
        reasonPlaceholder: "Describe the reason",
        mode: "Compensation type",
        amount: "Amount",
        percent: "Percent",
        value: "Value",
        valuePlaceholder: "Enter amount or percent",
        comment: "Comment",
        commentPlaceholder: "Additional details",
        issue: "Issue compensation",
        issued: "Compensation issued",
        submitting: "Submitting...",
        required: "Reason and value are required"
      }
    },
    clients: {
      profile: {
        eyebrow: "Client profile",
        title: "Client",
        idLabel: "ID"
      },
      searchPlaceholder: "Search by name or phone",
      allStatuses: "All statuses",
      table: {
        client: "Client",
        phone: "Phone",
        orders: "Orders",
        status: "Status"
      },
      confirm: {
        blockTitle: "Block this client?",
        unblockTitle: "Unblock this client?",
        description: "Client access will be restricted. Continue?"
      },
      prompts: {
        name: "Client name",
        phone: "Phone"
      },
      toasts: {
        updated: "Client updated",
        statusUpdated: "Status updated",
        noteAdded: "Note added",
        noteDeleted: "Note deleted"
      },
      actions: {
        block: "Block client",
        unblock: "Unblock client",
        blockConfirm: "Block this client?",
        unblockConfirm: "Unblock this client?"
      },
      overview: {
        details: "Client details",
        metrics: "Metrics",
        support: "Support actions",
        primaryAddress: "Primary address",
        lastPromo: "Latest promo",
        manageAddresses: "Manage addresses",
        viewPromos: "View promos"
      },
      metrics: {
        orders: "Orders",
        totalSpent: "Total spent",
        avgCheck: "Average check"
      },
      orders: {
        title: "Orders",
        searchPlaceholder: "Search by orderId",
        allStatuses: "All statuses"
      },
      notes: {
        title: "Notes",
        note: "Note",
        placeholder: "Write a note...",
        support: "Support note"
      },
      addresses: {
        title: "Addresses",
        add: "Add address",
        edit: "Edit address",
        address: "Address",
        label: "Label",
        entrance: "Entrance",
        floor: "Floor",
        apartment: "Apartment",
        comment: "Comment",
        primary: "Primary",
        setPrimary: "Set primary",
        none: "No addresses yet",
        required: "Address is required",
        saved: "Address saved",
        deleted: "Address deleted",
        primaryUpdated: "Primary address updated",
        deleteTitle: "Delete address?",
        deleteDescription: "This action cannot be undone."
      },
      promos: {
        title: "Promos",
        issue: "Issue promo",
        none: "No promos yet",
        reasonRequired: "Reason is required",
        valueRequired: "Value is required",
        issued: "Promo issued",
        copied: "Code copied",
        revokeTitle: "Revoke promo?",
        revokeDescription: "This promo will be revoked.",
        revoked: "Promo revoked",
        copy: "Copy code",
        revoke: "Revoke",
        table: {
          code: "Code",
          typeValue: "Type / value",
          status: "Status",
          expires: "Expires",
          reason: "Reason",
          issuedBy: "Issued by",
          issuedAt: "Issued at",
          order: "Order",
          actions: "Actions"
        },
        form: {
          type: "Type",
          value: "Value",
          expires: "Expires",
          minOrder: "Min order",
          relatedOrder: "Related order",
          reason: "Reason"
        }
      }
    },
    couriers: {
      profile: {
        eyebrow: "Courier profile",
        title: "Courier",
        idLabel: "ID"
      },
      status: {
        online: "Online",
        offline: "Offline"
      },
      toasts: {
        updated: "Courier profile updated",
        statusUpdated: "Status updated",
        noteAdded: "Note added",
        noteDeleted: "Note deleted"
      },
      overview: {
        title: "Courier overview"
      },
      fields: {
        fullName: "Full name",
        address: "Address",
        deliveryMethods: "Delivery methods",
        ratingCount: "Rating count",
        name: "Name",
        phone: "Phone",
        status: "Status",
        online: "Online",
        rating: "Rating",
        createdAt: "Created",
        updatedAt: "Updated"
      },
      methods: {
        walk: "On foot",
        bike: "Bike",
        car: "Car / moto"
      },
      actions: {
        block: "Block courier",
        unblock: "Unblock courier",
        noAccess: "No access",
        blockConfirm: "Block this courier?",
        unblockConfirm: "Unblock this courier?",
        confirmDescription: "This action will update courier status."
      },
      filters: {
        allStatuses: "All statuses",
        allBlocked: "All blocked"
      },
      table: {
        courier: "Courier",
        phone: "Phone",
        status: "Status",
        rating: "Rating",
        ordersToday: "Orders today",
        blocked: "Blocked"
      },
      notes: {
        title: "Notes",
        note: "Note",
        placeholder: "Write a note...",
        support: "Support note"
      }
    },
    partners: {
      profile: {
        eyebrow: "Partner profile",
        idLabel: "ID"
      },
      overview: {
        title: "Partner overview"
      },
      fields: {
        name: "Name",
        manager: "Manager",
        contactName: "Contact person",
        email: "Email",
        phone1: "Phone 1",
        phone2: "Phone 2",
        phone3: "Phone 3",
        outlets: "Outlets",
        status: "Status"
      },
      actions: {
        block: "Block partner",
        unblock: "Unblock partner",
        noAccess: "No access",
        blockConfirm: "Block this partner?",
        unblockConfirm: "Unblock this partner?",
        confirmDescription: "This action will update partner status."
      },
      toasts: {
        statusUpdated: "Status updated",
        noteAdded: "Note added",
        noteDeleted: "Note deleted"
      },
      searchPlaceholder: "Search by name or manager",
      allStatuses: "All statuses",
      table: {
        partner: "Partner",
        status: "Status",
        outlets: "Outlets",
        manager: "Manager"
      },
      notes: {
        title: "Notes",
        note: "Note",
        placeholder: "Write a note...",
        support: "Support note"
      },
      finance: {
        summary: {
          turnover: "Turnover",
          commission: "Platform commission",
          payouts: "Partner payouts"
        }
      }
    },
    outlets: {
      profile: {
        eyebrow: "Outlet profile",
        idLabel: "ID"
      },
      overview: {
        title: "Outlet overview"
      },
      fields: {
        name: "Name",
        partner: "Partner",
        type: "Type",
        address: "Address",
        addressComment: "Address comment",
        phone: "Phone",
        email: "Email",
        status: "Status",
        statusReason: "Status reason",
        hours: "Working hours",
        deliveryZone: "Delivery zone"
      },
      actions: {
        activate: "Activate",
        tempDisable: "Temporarily disable",
        block: "Block outlet",
        noAccess: "No access"
      },
      status: {
        open: "Open",
        closed: "Closed",
        blocked: "Blocked"
      },
      toasts: {
        statusUpdated: "Status updated",
        noteAdded: "Note added",
        noteDeleted: "Note deleted"
      },
      searchPlaceholder: "Search by name or address",
      filters: {
        partnerId: "Partner ID",
        allTypes: "All types",
        restaurant: "Restaurant",
        shop: "Shop",
        allStatuses: "All statuses"
      },
      confirm: {
        statusTitle: "Change outlet status?",
        statusDescription: "Outlet status will be updated.",
        reasonPlaceholder: "Provide a disable reason"
      },
      table: {
        outlet: "Outlet",
        partner: "Partner",
        address: "Address",
        status: "Status",
        openClose: "Open/Close",
        type: "Type"
      },
      notes: {
        title: "Notes",
        note: "Note",
        placeholder: "Write a note...",
        support: "Support note"
      },
      menu: {
        title: "Menu",
        addItem: "Add item",
        createItem: "Create item",
        search: "Search items",
        empty: "No items yet",
        sale: "Sale",
        history: "Price history",
        enable: "Enable",
        disable: "Disable",
        editItem: "Edit item",
        priceHistory: "Price history",
        noHistory: "No history yet",
        filters: {
          all: "All",
          available: "Available",
          unavailable: "Unavailable"
        },
        sort: {
          titleAsc: "Name A-Z",
          titleDesc: "Name Z-A",
          priceLow: "Price low to high",
          priceHigh: "Price high to low",
          updated: "Recently updated"
        },
        table: {
          title: "Item",
          category: "Category",
          sku: "SKU",
          weight: "Weight",
          photo: "Photo",
          photoLink: "Open",
          basePrice: "Base price",
          currentPrice: "Current price",
          availability: "Availability",
          stock: "Stock",
          updated: "Updated"
        },
        form: {
          title: "Title",
          category: "Category",
          sku: "SKU",
          description: "Description",
          photoUrl: "Photo URL",
          weight: "Weight (g)",
          unavailableReason: "Stop-list reason",
          unavailableUntil: "Auto restore",
          basePrice: "Base price",
          stock: "Stock",
          availability: "Availability",
          reason: "Reason"
        },
        confirm: {
          available: "Set as available?",
          unavailable: "Set as unavailable?",
          description: "Item availability will be updated.",
          deleteTitle: "Delete item?",
          deleteDescription: "Item will be removed from the menu."
        },
        toasts: {
          updated: "Item updated",
          availabilityUpdated: "Availability updated",
          created: "Item added",
          deleted: "Item deleted"
        },
        prompts: {
          unavailableReason: "Stop-list reason"
        },
        validation: {
          required: "Title and price are required",
          reasonRequired: "Stop-list reason is required"
        },
        stoplist: {
          noReason: "No reason provided"
        },
        historyTable: {
          old: "Old price",
          new: "New price",
          reason: "Reason",
          changedAt: "Changed at"
        }
      },
      campaigns: {
        title: "Campaigns",
        create: "Create campaign",
        edit: "Edit campaign",
        saved: "Campaign saved",
        activateTitle: "Activate campaign?",
        activateDescription: "Campaign will be activated.",
        activated: "Campaign activated",
        endTitle: "End campaign?",
        endDescription: "Campaign will be ended.",
        ended: "Campaign ended",
        empty: "No campaigns yet",
        table: {
          title: "Title",
          status: "Status",
          start: "Start",
          end: "End",
          items: "Items"
        },
        itemsTitle: "Campaign items",
        itemsEmpty: "No items yet",
        addItem: "Add item",
        itemSaved: "Item saved",
        itemRemoved: "Item removed",
        itemsRequired: "Select at least one item",
        outletsRequired: "Select at least one outlet",
        itemRemoveTitle: "Remove item?",
        itemRemoveDescription: "Item will be removed from campaign.",
        itemTitle: "Item",
        selectItem: "Select item",
        selectItems: "Select items",
        form: {
          title: "Title",
          start: "Start",
          end: "End",
          item: "Item",
          discountType: "Discount type",
          discountValue: "Discount value",
          outlets: "Outlets",
          status: "Status",
          bundle: "Bundle"
        },
        itemsTable: {
          item: "Item",
          basePrice: "Base price",
          discount: "Discount",
          bundle: "Bundle",
          resultPrice: "Result price"
        },
        discount: {
          percent: "Percent",
          fixed: "Fixed",
          newPrice: "New price"
        },
        status: {
          planned: "Planned",
          active: "Active",
          ended: "Ended"
        },
        remove: "Remove"
      }
    },
    promos: {
      profile: {
        eyebrow: "Promo profile",
        idLabel: "ID"
      },
      toasts: {
        updated: "Promo updated",
        created: "Promo created"
      },
      filters: {
        search: "Search",
        all: "All statuses"
      },
      table: {
        code: "Code",
        discount: "Discount",
        outlets: "Outlets",
        usage: "Usage",
        status: "Status",
        allOutlets: "All outlets"
      },
      status: {
        active: "Active",
        inactive: "Inactive"
      },
      actions: {
        activate: "Activate",
        deactivate: "Deactivate",
        create: "Create campaign",
        activateTitle: "Activate promo?",
        deactivateTitle: "Deactivate promo?",
        confirmDescription: "Promo status will be updated.",
        statusUpdated: "Status updated"
      },
      form: {
        code: "Code",
        description: "Description",
        discount: "Discount",
        maxUses: "Max uses",
        usedCount: "Used",
        active: "Active",
        startsAt: "Starts at",
        endsAt: "Ends at",
        minOrderAmount: "Min order amount",
        outletId: "Outlet ID",
        outlets: "Outlets",
        allOutlets: "All outlets",
        firstOrderOnly: "First order only"
      }
    },
    finance: {
      searchTitle: "Search",
      allStatuses: "All statuses",
      allTypes: "All types",
      outletId: "Outlet ID",
      partnerId: "Partner ID",
      export: "Export",
      total: "Total",
      noData: "No data",
      noExport: "No data to export",
      table: {
        title: "Title",
        amount: "Amount",
        status: "Status",
        type: "Type",
        order: "Order",
        outlet: "Outlet",
        partner: "Partner",
        date: "Date"
      },
      types: {
        commission: "Commission",
        courier_payout: "Courier payout",
        penalty: "Penalty",
        payment: "Payment",
        refund: "Refund",
        bonus: "Bonus",
        service_fee: "Service fee",
        delivery_share: "Delivery share"
      }
    },
    audit: {
      actor: "Actor",
      before: "Before",
      after: "After",
      entities: {
        all: "All",
        user: "User",
        client: "Client",
        courier: "Courier",
        partner: "Partner",
        outlet: "Outlet",
        order: "Order",
        promo: "Promo"
      },
      filters: {
        actorId: "Actor ID"
      },
      table: {
        entity: "Entity",
        entityId: "Entity ID",
        action: "Action",
        actor: "Actor",
        timestamp: "Timestamp",
        diff: "Diff"
      }
    },
    currency: {
      sum: "sum"
    }
  }
};

const fillMissing = (target, source) => {
  if (!target || !source) {
    return;
  }
  Object.keys(source).forEach((key) => {
    const value = source[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      fillMissing(target[key], value);
      return;
    }
    if (!(key in target)) {
      target[key] = value;
    }
  });
};

fillMissing(translations.kaa, translations.uz);

export const resolveLocale = (value) =>
  locales.includes(value) ? value : defaultLocale;

const lookup = (locale, key) => {
  const source = translations[locale];
  if (!source) {
    return null;
  }
  return key.split(".").reduce((acc, part) => acc?.[part], source) ?? null;
};

export const t = (locale, key, params = {}) => {
  const { defaultValue, ...rest } = params;
  const current = lookup(locale, key);
  const fallback = lookup(defaultLocale, key);
  const value = current ?? fallback ?? defaultValue ?? key;
  if (typeof value !== "string") {
    return key;
  }
  return value.replace(/\{(\w+)\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(rest, name) ? String(rest[name]) : `{${name}}`
  );
};

export const translateStatus = (locale, status) =>
  t(locale, `status.${status}`, { defaultValue: status });

export const translateRole = (locale, role) =>
  t(locale, `roles.${role}`, { defaultValue: role });

