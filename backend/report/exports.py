import pandas as pd
import io

class ExportManager:
    """
    Handles exporting report data to CSV and Excel.
    """
    @staticmethod
    def to_csv(trades):
        if not trades:
            return ""
        df = pd.DataFrame(trades)
        return df.to_csv(index=False)

    @staticmethod
    def to_excel(report_data):
        """
        Generates a multi-sheet Excel file with metrics and trades.
        """
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # Metrics Sheet
            metrics = report_data.get('metrics', {})
            df_metrics = pd.DataFrame(list(metrics.items()), columns=['Metric', 'Value'])
            df_metrics.to_excel(writer, sheet_name='Summary', index=False)
            
            # Trades Sheet
            trades = report_data.get('trades', [])
            if trades:
                df_trades = pd.DataFrame(trades)
                df_trades.to_excel(writer, sheet_name='Trade Journal', index=False)
                
        return output.getvalue()
