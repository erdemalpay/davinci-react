import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import {
  ProductForm,
  initialProductForm,
  useProductFormInputs,
} from "../../hooks/useProductFormInputs";
import {
  AccountBrand,
  AccountVendor,
  ActionEnum,
  DisabledConditionEnum,
} from "../../types";
import { useAccountBrandMutations } from "../../utils/api/account/brand";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import {
  useAccountServiceMutations,
  useGetAccountServices,
} from "../../utils/api/account/service";
import { useAccountVendorMutations } from "../../utils/api/account/vendor";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { NameInput } from "../../utils/panelInputs";
import { isActionDisabled } from "../../utils/permissions";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  GenericInputType,
} from "../panelComponents/shared/types";

type QuickCreateDefinitionType = "vendor" | "brand";

// Yeni tanımın bağlanacağı ürün ya da hizmet; gider formlarında seçenekler bunun listesine göre gelir.
export type QuickCreateTarget = { kind: "product" | "service"; id: string };

type SelectCreated = (value: number | string) => void;

type ProductPayload = Omit<ProductForm, "matchedMenuItem"> & {
  matchedMenuItem: number;
};

const disabledConditionByType = {
  vendor: DisabledConditionEnum.ACCOUNTING_VENDOR,
  brand: DisabledConditionEnum.ACCOUNTING_BRAND,
};

// Tanımlamalar > Ürünler'deki ürün formunun aynısı; kayıttan sonra oluşan ürünü seçtirir.
const QuickCreateProductPanel = ({
  close,
  createProduct,
}: {
  close: () => void;
  createProduct: (payload: ProductPayload) => void;
}) => {
  const [inputForm, setInputForm] = useState<ProductForm>(initialProductForm);
  const { inputs, formKeys } = useProductFormInputs({
    inputForm,
    isAddModalOpen: true,
    isEditModalOpen: false,
  });

  return (
    <GenericAddEditPanel
      isOpen
      close={close}
      inputs={inputs}
      formKeys={formKeys}
      setForm={setInputForm}
      generalClassName="overflow-visible"
      topClassName="flex flex-col gap-2"
      submitItem={() => undefined}
      submitFunction={() =>
        createProduct({
          ...inputForm,
          matchedMenuItem: Number(inputForm.matchedMenuItem),
        })
      }
    />
  );
};

// Seçim kutusuna "Yeni ürün / tedarikçi / marka oluştur" satırı ekler; kayıt oluşunca formda seçtirir.
// Tedarikçi ve marka, Tanımlamalar'daki satır "+" işleminin yaptığı gibi seçili ürünün (hizmetin) listesine eklenir.
// Kullanım: createNewProduct() ya da createNewFor(type, target) sonucunu girdinin `createNew` alanına ver,
// quickCreateModals'ı sayfada çiz.
export function useQuickCreate() {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  // Modal kapanınca mutation'ların geri çağrısı kaybolmasın diye hepsi sayfa düzeyinde kalır
  const { createAccountProduct, updateAccountProduct } =
    useAccountProductMutations();
  const { createAccountVendor } = useAccountVendorMutations();
  const { createAccountBrand } = useAccountBrandMutations();
  const { updateAccountService } = useAccountServiceMutations();
  const products = useGetAccountProducts();
  const services = useGetAccountServices();
  const [productPending, setProductPending] = useState<{
    select: SelectCreated;
  } | null>(null);
  const [definitionPending, setDefinitionPending] = useState<{
    type: QuickCreateDefinitionType;
    target: QuickCreateTarget;
    select: SelectCreated;
  } | null>(null);

  const isAllowed = useCallback(
    (condition: DisabledConditionEnum, ...actions: ActionEnum[]) =>
      actions.every(
        (action) =>
          !isActionDisabled(
            getItem(condition, disabledConditions),
            action,
            user
          )
      ),
    [disabledConditions, user]
  );

  const createNewProduct = useCallback((): GenericInputType["createNew"] => {
    if (!isAllowed(DisabledConditionEnum.ACCOUNTING_PRODUCT, ActionEnum.ADD)) {
      return undefined;
    }
    return {
      label: t("Create new product"),
      onClick: (select) => setProductPending({ select }),
    };
  }, [t, isAllowed]);

  const createNewFor = useCallback(
    (
      type: QuickCreateDefinitionType,
      target?: QuickCreateTarget
    ): GenericInputType["createNew"] => {
      // Hizmetlerin markası yok; marka yalnızca ürüne bağlanır
      if (!target?.id || (type === "brand" && target.kind === "service")) {
        return undefined;
      }
      if (
        !isAllowed(
          disabledConditionByType[type],
          ActionEnum.ADD,
          ActionEnum.ADD_TO_ELEMENT
        )
      ) {
        return undefined;
      }
      return {
        label:
          type === "vendor" ? t("Create new vendor") : t("Create new brand"),
        onClick: (select) => setDefinitionPending({ type, target, select }),
      };
    },
    [t, isAllowed]
  );

  const attachToTarget = (
    type: QuickCreateDefinitionType,
    target: QuickCreateTarget,
    createdId: string
  ) => {
    if (target.kind === "service") {
      const service = services?.find((item) => item._id === target.id);
      updateAccountService({
        id: target.id,
        updates: { vendor: [...(service?.vendor ?? []), createdId] },
      });
      return;
    }
    const product = products?.find((item) => item._id === target.id);
    updateAccountProduct({
      id: target.id,
      updates:
        type === "vendor"
          ? { vendor: [...(product?.vendor ?? []), createdId] }
          : { brand: [...(product?.brand ?? []), createdId] },
    });
  };

  const quickCreateModals = (
    <>
      {productPending && (
        <QuickCreateProductPanel
          close={() => setProductPending(null)}
          createProduct={(form) =>
            createAccountProduct(form, {
              onSuccess: (created) => productPending.select(created._id),
            })
          }
        />
      )}
      {definitionPending && (
        <GenericAddEditPanel
          isOpen
          close={() => setDefinitionPending(null)}
          topClassName="flex flex-col gap-2"
          inputs={[NameInput({ t })]}
          formKeys={[{ key: "name", type: FormKeyTypeEnum.STRING }]}
          submitItem={(item) => {
            const onSuccess = (created: { _id: string }) => {
              attachToTarget(
                definitionPending.type,
                definitionPending.target,
                created._id
              );
              definitionPending.select(created._id);
            };
            if (definitionPending.type === "vendor") {
              createAccountVendor(item as AccountVendor, { onSuccess });
            } else {
              createAccountBrand(item as AccountBrand, { onSuccess });
            }
          }}
        />
      )}
    </>
  );

  return { createNewProduct, createNewFor, quickCreateModals };
}
