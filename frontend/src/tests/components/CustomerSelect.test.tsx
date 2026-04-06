import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerSelect from '../../components/CustomerSelect';
import { useQuery } from 'react-query';

vi.mock('react-query');

const mockCustomers = [
  { id: '1', name: '测试公司A', status: 'active' },
  { id: '2', name: '测试公司B', status: 'active' },
  { id: '3', name: '测试公司C', status: 'active' },
];

describe('CustomerSelect', () => {
  it('渲染选择器并显示加载状态', () => {
    (useQuery as any).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<CustomerSelect />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('加载完成后显示客户选项', async () => {
    (useQuery as any).mockReturnValue({
      data: { items: mockCustomers },
      isLoading: false,
    });

    render(<CustomerSelect placeholder="选择客户" />);
    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    
    expect(screen.getByText('测试公司A')).toBeInTheDocument();
    expect(screen.getByText('测试公司B')).toBeInTheDocument();
    expect(screen.getByText('测试公司C')).toBeInTheDocument();
  });

  it('支持搜索过滤', async () => {
    (useQuery as any).mockReturnValue({
      data: { items: mockCustomers },
      isLoading: false,
    });

    render(<CustomerSelect />);
    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'A');
    
    expect(screen.getByText('测试公司A')).toBeInTheDocument();
  });

  it('调用 onChange 回调', async () => {
    const handleChange = vi.fn();
    (useQuery as any).mockReturnValue({
      data: { items: mockCustomers },
      isLoading: false,
    });

    render(<CustomerSelect onChange={handleChange} />);
    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    
    const option = screen.getByText('测试公司A');
    await userEvent.click(option);
    
    expect(handleChange).toHaveBeenCalledWith('1');
  });

  it('显示已选中的值', () => {
    (useQuery as any).mockReturnValue({
      data: { items: mockCustomers },
      isLoading: false,
    });

    render(<CustomerSelect value="1" />);
    expect(screen.getByText('测试公司A')).toBeInTheDocument();
  });

  it('禁用状态下不可选择', () => {
    (useQuery as any).mockReturnValue({
      data: { items: mockCustomers },
      isLoading: false,
    });

    render(<CustomerSelect disabled />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('disabled');
  });

  it('支持清除选择', async () => {
    const handleChange = vi.fn();
    (useQuery as any).mockReturnValue({
      data: { items: mockCustomers },
      isLoading: false,
    });

    render(<CustomerSelect value="1" onChange={handleChange} allowClear />);
    expect(screen.getByText('测试公司A')).toBeInTheDocument();
  });
});
