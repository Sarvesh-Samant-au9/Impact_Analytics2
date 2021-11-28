import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useSortBy, useTable } from "react-table";
import axios from "axios";

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

// Reset Button styling component
const StyledButtonReset = styled.button`
  padding: 10px;
  border-radius: 5px;
  color: white;
  background: black;
  border: none;
  outline: none;
  width: 100px;
  margin: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all ease-in 0.4s;
  font-size: 1.2rem;
  &:hover {
    color: black;
    background: white;
    border: 2px solid black;
  }
`;

// Submit Button styling component
const StyledButtonSubmit = styled.button`
  padding: 10px;
  border-radius: 5px;
  color: white;
  background: #5454d4;
  border: none;
  outline: none;
  width: 100px;
  margin: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all ease-in 0.4s;
  font-size: 1.2rem;
  &:hover {
    color: #5454d4;
    background: white;
    border: 2px solid #5454d4;
  }
`;

const EditableCell = ({
  value: initialValue,
  row: { index },
  column: { id },
  updateMyData
}) => {
  const [value, setValue] = React.useState(initialValue);
  const onChange = (e) => {
    setValue(e.target.value);
  };

  const onBlur = () => {
    updateMyData(index, id, value);
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  if (id === "price") {
    // console.log(id, index, value);
    return (
      <input value={value} type="number" onChange={onChange} onBlur={onBlur} />
    );
  }
  return value;
};

const defaultColumn = {
  Cell: EditableCell
};

function Table({ columns, data, updateMyData }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      updateMyData
    },
    useSortBy
  );

  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                {column.render("Header")}
                <span>
                  {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                </span>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function App() {
  //dataAPI is for getting info from api
  const [dataAPI, setDataAPI] = useState([]);

  // loading is to see whether api has been fetched or not
  const [loading, setLoading] = useState(true);

  //livedata is to keep a copy of fetched api info so as for reset functionality
  const [liveData, setLiveData] = useState([]);

  //on refresh the data does not change it is use to store the changed price data in localstorage
  const [updatedData, setUpdatedData] = useState(
    JSON.parse(localStorage.getItem("dataStored")) || []
  );

  //async function to make call to api to get the related info
  const fetchData = async () => {
    const { data } = await axios.get(
      `https://s3-ap-southeast-1.amazonaws.com/he-public-data/reciped9d7b8c.json`
    );
    setDataAPI(data);
    setLiveData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // change the cell for price field only
  const updateMyData = (rowIndex, columnId, value) => {
    setDataAPI((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value
          };
        }
        return row;
      })
    );
  };

  // Columns heading and rendering (from react-table)
  const columns = React.useMemo(
    () => [
      {
        Header: "First Name",
        accessor: "name"
      },
      {
        Header: "Label",
        accessor: "label",
        disableSortBy: true
      },
      {
        Header: "Price",
        accessor: "price"
      },
      {
        Header: "Description",
        accessor: "description",
        toggleSortBy: false,
        disableSortBy: true
      }
    ],
    []
  );

  // to send the data as either updated or the original, the data actually depends upon the reset and submit functionality
  const data = React.useMemo(() => {
    return updatedData.length > 0 ? updatedData : dataAPI;
  }, [dataAPI, updatedData]);

  // to reset the data to the first value, initally did take livedata copy so setdataAPI is back to the otiginal data, no call made whatsoever as per requirement
  const onclickReset = () => {
    setDataAPI(liveData);
    localStorage.removeItem("dataStored");
    setUpdatedData([]);
    window.alert("Reset all the values");
  };

  // on Submit to store the edit data (price) in localstorage
  const onsubmit = () => {
    localStorage.setItem("dataStored", JSON.stringify(dataAPI));
    window.alert("Submitted the changes");
  };

  return loading ? (
    <h1>Loading from Source</h1>
  ) : (
    <Styles>
      <StyledButtonReset onClick={onclickReset}> Reset </StyledButtonReset>
      <StyledButtonSubmit onClick={onsubmit}> Submit</StyledButtonSubmit>

      <Table columns={columns} data={data} updateMyData={updateMyData} />
    </Styles>
  );
}

export default App;
