import { Select } from "antd";
import { useQuery } from "react-query";
import { customerApi } from "../services/customer";

interface CustomerSelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  style?: React.CSSProperties;
}

export default function CustomerSelect({
  value,
  onChange,
  placeholder = "选择客户",
  disabled = false,
  allowClear = true,
  style,
}: CustomerSelectProps) {
  const { data, isLoading } = useQuery(
    ["customers-select"],
    () => customerApi.list({ page: 1, page_size: 100 }),
    { keepPreviousData: true }
  );

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      loading={isLoading}
      showSearch
      filterOption={(input, option) =>
        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
      }
      style={style}
      options={data?.items?.map((customer) => ({
        value: customer.id,
        label: customer.name,
      }))}
    />
  );
}
