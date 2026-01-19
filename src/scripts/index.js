import { getUserInfo, getCardList, setUserInfo, changeLikeCardStatus } from "./components/api.js";
import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from './components/validation.js';

// Валидация
const validationConfig = {
    formSelector: '.popup__form',
    inputSelector: '.popup__input',
    submitButtonSelector: '.popup__button',
    inactiveButtonClass: 'popup__button_disabled',
    inputErrorClass: 'popup__input_type_error',
    errorClass: 'popup__error_visible'
};

// Включает валидацию форм
enableValidation(validationConfig);

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const infoModalWindow = document.querySelector(".popup_type_info");
const infoCloseButton = infoModalWindow.querySelector(".popup__close");
const infoDefinitionList = infoModalWindow.querySelector(".popup__info");
const infoUserList = infoModalWindow.querySelector(".popup__list");

const infoDefinitionTemplate = document.getElementById("popup-info-definition-template").content.querySelector(".popup__info-item");
const infoUserPreviewTemplate = document.getElementById("popup-info-user-preview-template").content.querySelector(".popup__list-item");

const logoButton = document.querySelector(".header__logo");

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const renderLoading = (button, isLoading, defaultText, loadingText) => {
  if (isLoading) {
    button.textContent = loadingText;
  } else {
    button.textContent = defaultText;
  }
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(".popup__button");
  renderLoading(submitButton, true, "Сохранить", "Сохранение...");

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
      .then((userData) => {
        profileTitle.textContent = userData.name;
        profileDescription.textContent = userData.about;
        closeModalWindow(profileFormModalWindow);
      })
      .catch((err) => console.log(err))
      .finally(() => {
        renderLoading(submitButton, false, "Сохранить", "Сохранение...");
      });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector('.popup__button');
  renderLoading(submitButton, true, "Создать", "Создание...");

  setNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      const cardElement = createCardElement(cardData, {
        onPreviewPicture: handlePreviewPicture, // При клике на картинку откроется большое изображение
        onLikeIcon: (btn, counter) => handleChangeLike(btn, counter, cardData, userId), // Лайк
        onDeleteCard: (el) => handleDeleteCard(el, cardData), // Удаление
        });
        placesWrap.prepend(cardElement); 
        closeModalWindow(cardFormModalWindow); 
    })
    .catch((err) => console.log(err))
    .finally(() => {
      renderLoading(submitButton, false, "Создать", "Создание...");
    })
  };

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");
  renderLoading(submitButton, true, "Сохранить", "Сохранение...");

  setAvatar({ 
    avatar: avatarInput.value 
  })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => {
      renderLoading(submitButton, false, "Сохранить", "Сохранение...");
    });
};

  const handleDeleteCard = (cardElement, cardData) => {
    deleteCard(cardData._id)
      .then(() => {
        cardElement.remove();
      })
      .catch((err) => {
        console.log(err);
      })
  }
  const handleChangeLike = (likeButton, likeCountElement, cardData, userId) => {
    const isLiked = likeButton.classList.contains('card__like-button_is-active');
    changeLikeCardStatus(cardData._id, isLiked)
      .then((updatedCard) => {
        const isLikedNow = updatedCard.likes.some(user => user._id === userId); // Проверка лайка от user
        likeButton.classList.toggle("card__like-button_is-active", isLikedNow); // Изменение внешнего вида кнопки
        likeCountElement.textContent = updatedCard.likes.length; // Обновление счетчика лайков
      })
      .catch(err => 
        console.log(err)
      );
};

// Статистика
const handleInfoModalOpen = () => { // Очищаем старые данные
  infoDefinitionList.textContent = "";
  infoUserList.textContent = "";

  getCardList()
    .then((cards) => {
      const usersStats = {}; 
      let likesSum = 0; // Общее число лайков на сайте

      // Собираем статистику
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const ownerId = card.owner._id;

        if (!usersStats[ownerId]) {
          usersStats[ownerId] = {
            name: card.owner.name,
            likes: 0,
          };
        }

        usersStats[ownerId].likes += card.likes.length;
        likesSum += card.likes.length;
      }

      const usersArray = Object.values(usersStats);

      // Ищем пользователя с максимальным числом лайков
      const leader = usersArray.reduce(
        (acc, user) => (user.likes > acc.likes ? user : acc),
        { likes: 0 } // Начальное значение, если нет ни одного пользователя
      );

      // Helper для добавления строки
      const renderStatRow = (label, value) => {
        const row = infoDefinitionTemplate.cloneNode(true); // Клонируем из HTML
        row.querySelector(".popup__info-term").textContent = label;
        row.querySelector(".popup__info-description").textContent = value;
        infoDefinitionList.appendChild(row); // Добавляем HTML-код row внутрь infoDefinitionList
      };

      renderStatRow("Всего пользователей:", usersArray.length);
      renderStatRow("всего лайков:", likesSum);
      renderStatRow("Максимально лайков от одного:", leader.likes || 0);
      renderStatRow("Чемпион лайков:", leader.name || "Нет данных");

      // Выбираем 3 карточки с наибольшим количеством лайков 
      const popularCards = cards
        .slice() 
        .sort((c1, c2) => c2.likes.length - c1.likes.length) // Сортировка от большего к меньшему
        .slice(0, 3);

      popularCards.forEach((card) => {
        const item = infoUserPreviewTemplate.cloneNode(true);
        item.textContent = `${card.name} (${card.likes.length})`;
        infoUserList.appendChild(item);
      });

      openModalWindow(infoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Закрытие окна статистики по кнопке
infoCloseButton.addEventListener("click", () => closeModalWindow(infoModalWindow));

// Открытие статистики по клику на лого
logoButton.addEventListener("click", handleInfoModalOpen);

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);


openProfileFormButton.addEventListener("click", () => {
    profileTitleInput.value = profileTitle.textContent;
    profileDescriptionInput.value = profileDescription.textContent;

    clearValidation(profileForm, validationConfig);
    openModalWindow(profileFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
    cardForm.reset();

    clearValidation(cardForm, validationConfig);
    openModalWindow(cardFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
    avatarForm.reset();

    clearValidation(avatarForm, validationConfig);
    openModalWindow(avatarFormModalWindow);
});

// Обработчики закрытия попапов
const allPopup = document.querySelectorAll(".popup");
allPopup.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

  Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    let userId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((card) => {
      const cardElement = createCardElement(card, {
        onPreviewPicture: handlePreviewPicture,
        onLikeIcon: (btn, counter) => 
          handleChangeLike(btn, counter, card, userId),
        onDeleteCard: (el) => handleDeleteCard(el, card),
      });
      if (card.owner._id !== userId) {
        const deleteButton = cardElement.querySelector(
          '.card__control-button_type_delete'
        );
        deleteButton.remove();
      }
      if (card.likes.some((user) => user._id === userId)) {
        const likeButton = cardElement.querySelector('.card__like-button');
        likeButton.classList.add('card__like-button_is-active');
      }
      const likeCountElement = cardElement.querySelector('.card__like-count');
      likeCountElement.textContent = card.likes.length;
      placesWrap.prepend(cardElement);
    });
  })
  .catch((err) => {
    console.log(err); // В случае возникновения ошибки выводим её в консоль
  });