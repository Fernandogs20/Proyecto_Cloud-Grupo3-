import { createStyles } from 'antd-style';

export default createStyles(({ css }) => ({
  container: css`
    width: 100%;
  `,
  stepContent: css`
    padding: 24px 0;
    min-height: 400px;
  `,
  topologyGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  `,
  topologyCard: css`
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  `,
  selected: css`
    background-color: #f0f5ff;
  `,
  topologyIcon: css`
    font-size: 32px;
    margin: 12px 0;
  `,
  topologyName: css`
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  `,
  topologyDesc: css`
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    line-height: 1.4;
  `,
  vmHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
    }
  `,
  vmList: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  `,
  vmCard: css`
    background-color: #fafafa;
  `,
  vmFields: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 520px;

    .ant-form-item {
      margin-bottom: 12px;
    }
  `,
  stepActions: css`
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    text-align: right;
  `,
  reviewItem: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  `,
  label: css`
    color: rgba(0, 0, 0, 0.65);
    font-weight: 500;
    min-width: 120px;
  `,
  vmReviewItem: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: #fafafa;
    margin-bottom: 12px;
    border-radius: 4px;
    gap: 16px;
  `,
  vmName: css`
    font-weight: 600;
    min-width: 150px;
  `,
  vmSpecs: css`
    color: rgba(0, 0, 0, 0.65);
    font-size: 12px;
  `,
}));
