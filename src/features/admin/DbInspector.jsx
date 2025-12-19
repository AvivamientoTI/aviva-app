import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

function DbInspector() {
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSchema() {
      try {
        // 1. Fetch table names from the RPC function
        const { data: tablesData, error: tablesError } = await supabase.rpc('get_schema_tables');

        if (tablesError) {
          throw new Error(`Error fetching tables: ${tablesError.message}`);
        }

        if (!tablesData) {
            throw new Error('No tables found. Make sure you have created the get_schema_tables function in your Supabase SQL editor.');
        }

        const tables = tablesData.map(t => t.table_name);

        // 2. Fetch data and schema for each table
        const schemaData = await Promise.all(
          tables.map(async (table) => {
            const { data, error } = await supabase.from(table).select('*').limit(100); // Limit to 100 rows per table for now
            if (error) {
              console.warn(`Error fetching data for table ${table}:`, error);
              return { name: table, data: [], error: error.message };
            }

            // A simple way to get column names from the first row
            const columns = data.length > 0 ? Object.keys(data[0]) : [];

            return { name: table, columns, data };
          })
        );

        setSchema(schemaData);
      } catch (e) {
        setError(e.message);
      }
    }

    fetchSchema();
  }, []);

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  if (!schema) {
    return <div style={{ padding: '20px' }}>Loading schema...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Database Inspector</h1>
      {schema.map((tableInfo) => (
        <div key={tableInfo.name} style={{ marginBottom: '40px' }}>
          <h2>{tableInfo.name}</h2>
          {tableInfo.error && <p style={{ color: 'orange' }}>Could not fetch data: {tableInfo.error}</p>}
          
          <h3>Schema (Columns)</h3>
          {tableInfo.columns.length > 0 ? (
            <ul>
              {tableInfo.columns.map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          ) : (
            <p>No columns found or table is empty.</p>
          )}

          <h3>Data (First 100 rows)</h3>
          {tableInfo.data.length > 0 ? (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {tableInfo.columns.map((col) => (
                    <th key={col} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableInfo.data.map((row, i) => (
                  <tr key={i}>
                    {tableInfo.columns.map((col) => (
                      <td key={col} style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No data in this table.</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default DbInspector;
