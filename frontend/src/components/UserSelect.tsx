import { Select } from "antd";
import { useQuery } from "react-query";
import { userApi } from "../services/user";

interface UserSelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  style?: React.CSSProperties;
}

export default function UserSelect({
  value,
  onChange,
  placeholder = "选择用户",
  disabled = false,
  allowClear = true,
  style,
}: UserSelectProps) {
  const { data, isLoading } = useQuery(
    ["users-select"],
    () => userApi.list({ page: 1, page_size: 100, status: "active" }),
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
      options={data?.items?.map((user) => ({
        value: user.id,
        label: user.displayName || user.username,
      }))}
    />
  );
}
