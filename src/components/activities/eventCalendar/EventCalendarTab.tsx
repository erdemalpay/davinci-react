import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../../context/User.context";
import { GenericButton } from "../../common/GenericButton";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import TextInput from "../../panelComponents/FormElements/TextInput";
import { useEventCalendarPoster } from "./useEventCalendarPoster";
import {
  ActionEnum,
  DisabledConditionEnum,
  EventCalendarItem,
  EventCalendarSetting,
} from "../../../types";
import {
  useEventCalendarMutations,
  useGetEventCalendars,
} from "../../../utils/api/eventCalendar";
import { useGetDisabledConditions } from "../../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../../utils/getItem";
import { isActionDisabled } from "../../../utils/permissions";
import {
  canShareImage,
  downloadImage,
  shareImage,
} from "../../../utils/saveImage";
import { BADGE_COLORS } from "../../../utils/eventCalendarAssets";
import EventCalendarRowEditor from "./EventCalendarRowEditor";

const MAX_ROWS = 8;

const EMPTY_ROW: EventCalendarItem = {
  badge: [],
  color: BADGE_COLORS[0],
  title: "",
  description: "",
  icon: "",
};

// Kayıt yokken editör bu örnekle açılır
const DEFAULT_CALENDAR = {
  title: "Kasım Ayı Etkinlikleri",
  items: [
    {
      badge: ["Her", "Pazartesi"],
      color: BADGE_COLORS[0],
      title: "Pazartesi Buluşmaları",
      description:
        "Yanında oyun arkadaşı getirmene gerek yok. Gel, tanış, oyna, eğlen, haftaya yine gel!",
      icon: "meeple",
    },
    {
      badge: ["Her", "Perşembe"],
      color: BADGE_COLORS[1],
      title: "Riftbound Nexus Night Turnuvası",
      description:
        "Runeterra evreninde kapışmalar devam ediyor. Desteni kap gel, ödülleri kazan!",
      icon: "cards",
    },
    {
      badge: ["15", "Kasım", "Pazar"],
      color: BADGE_COLORS[2],
      title: "Kale Kombo Turnuvası",
      description: "En iyi kaleyi kurup rakiplerini geride bırakabilir misin?",
      icon: "castle",
    },
    {
      badge: ["20", "Kasım", "Cuma"],
      color: BADGE_COLORS[3],
      title: "Kutu Oyunu Tasarım Günü",
      description:
        "Tasarım aşamasındaki oyunlar bu etkinlikte denemeye açılıyor. Oyununu denetmek ister misin?",
      icon: "notebook",
    },
    {
      badge: ["22", "Kasım", "Pazar"],
      color: BADGE_COLORS[4],
      title: "YTD Lansmanı",
      description:
        "Lava Games'in yeni oyunu YTD Ankaralı kutu oyunu severlerle buluşuyor.",
      icon: "game-box",
    },
    {
      badge: ["6", "Aralık", "Pazar"],
      color: BADGE_COLORS[5],
      title: "Magical Athlete & Pixies Lansmanı",
      description:
        "2026'da yerleşen Da Vinci oyunları sürpriz etkinliklerle sizlerle!",
      icon: "mushroom",
    },
  ] as EventCalendarItem[],
};

// Satır taşınıp silinince React her satırı (yükleme durumu dahil) doğru eşlesin
// diye sabit bir anahtar taşır; anahtar kaydedilmez
type EditorRow = { key: number; item: EventCalendarItem };

let nextRowKey = 0;
const toRow = (item: EventCalendarItem): EditorRow => ({
  key: nextRowKey++,
  item,
});

const EventCalendarEditor = ({ saved }: { saved?: EventCalendarSetting }) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const { createEventCalendar, updateEventCalendar } =
    useEventCalendarMutations();
  const [title, setTitle] = useState((saved ?? DEFAULT_CALENDAR).title);
  const [hasQr, setHasQr] = useState(saved?.hasQr !== false);
  const [rows, setRows] = useState(() =>
    (saved ?? DEFAULT_CALENDAR).items.map(toRow)
  );

  const isSaveDisabled = isActionDisabled(
    getItem(DisabledConditionEnum.EVENT_CALENDAR, disabledConditions),
    ActionEnum.UPDATE,
    user
  );

  // Boş rozet satırları ve fazlalık boşluklar kaydedilmez
  const cleanItems = useMemo(
    () =>
      rows.map(({ item }) => ({
        ...item,
        badge: item.badge.map((line) => line.trim()).filter(Boolean),
      })),
    [rows]
  );
  const posterData = useMemo(
    () => ({
      title,
      items: cleanItems,
      hasQr,
    }),
    [title, cleanItems, hasQr]
  );
  const { image, isLoading } = useEventCalendarPoster(posterData);
  const fileName = `${title || "etkinlik-takvimi"}.jpg`;

  // Anahtarla bulunur: ikon yüklenirken satır taşınsa da doğru satır güncellenir
  const changeItem = (key: number, patch: Partial<EventCalendarItem>) =>
    setRows((current) =>
      current.map((row) =>
        row.key === key ? { ...row, item: { ...row.item, ...patch } } : row
      )
    );

  const moveItem = (index: number, direction: -1 | 1) =>
    setRows((current) => {
      const next = [...current];
      [next[index], next[index + direction]] = [
        next[index + direction],
        next[index],
      ];
      return next;
    });

  const save = () => {
    const values = { title, items: cleanItems, hasQr };
    if (saved) updateEventCalendar({ id: saved._id, updates: values });
    else createEventCalendar(values);
  };

  return (
    <div className="w-[98%] mx-auto my-6 flex flex-col gap-4">
      <p className="text-sm text-gray-500 italic px-2">
        {t("EventCalendarHelp")}
      </p>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px] items-start">
        <div className="flex flex-col gap-3">
          <TextInput
            type="text"
            label={t("Poster Title")}
            value={title}
            maxLength={60}
            onChange={setTitle}
            onClear={() => setTitle("")}
          />
          <div className="flex items-center gap-3">
            <SwitchButton checked={hasQr} onChange={setHasQr} />
            <span className="text-sm font-medium text-gray-700">
              {t("Show QR on Poster")}
            </span>
          </div>
          {rows.map(({ key, item }, index) => (
            <EventCalendarRowEditor
              key={key}
              item={item}
              isFirst={index === 0}
              isLast={index === rows.length - 1}
              onChange={(patch) => changeItem(key, patch)}
              onMove={(direction) => moveItem(index, direction)}
              onRemove={() =>
                setRows((current) => current.filter((row) => row.key !== key))
              }
            />
          ))}
          <div className="flex gap-2">
            <GenericButton
              variant="outline"
              disabled={rows.length >= MAX_ROWS}
              onClick={() =>
                setRows((current) => [
                  ...current,
                  toRow({
                    ...EMPTY_ROW,
                    color: BADGE_COLORS[current.length % BADGE_COLORS.length],
                  }),
                ])
              }
            >
              {t("Add Row")}
            </GenericButton>
            <GenericButton disabled={isSaveDisabled} onClick={save}>
              {t("Save")}
            </GenericButton>
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:sticky lg:top-4">
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100 aspect-[4/5]">
            {image && (
              <img
                src={image}
                alt={title}
                className={`w-full h-full ${isLoading ? "opacity-60" : ""}`}
              />
            )}
            {!image && (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                {t("Preparing poster")}
              </div>
            )}
          </div>
          <GenericButton
            fullWidth
            disabled={!image || isLoading}
            onClick={() => downloadImage(image, fileName)}
          >
            {t("Download")}
          </GenericButton>
          {canShareImage() && (
            <GenericButton
              fullWidth
              variant="outline"
              disabled={!image || isLoading}
              onClick={() => shareImage(image, fileName)}
            >
              {t("Share")}
            </GenericButton>
          )}
        </div>
      </div>
    </div>
  );
};

const EventCalendarTab = () => {
  const eventCalendars = useGetEventCalendars();
  // Editör başlangıç değerini açılışta bir kez alır; kayıtlar gelmeden açılmaz
  if (eventCalendars === undefined) return null;
  return <EventCalendarEditor saved={eventCalendars[0]} />;
};

export default EventCalendarTab;
