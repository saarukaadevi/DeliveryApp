import React, { useState, useEffect, useContext,useRef } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import {
  features,
  language
} from 'config';
import { FirebaseContext } from 'common';
import PhotoSizeSelectSmallIcon from '@material-ui/icons/PhotoSizeSelectSmall';
import Modal from '@material-ui/core/Modal';
import { makeStyles } from '@material-ui/core/styles';
import FitnessCenterIcon from '@material-ui/icons/FitnessCenter';

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 680,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

export default function CarTypes() {
  const { api } = useContext(FirebaseContext);
  const {
    editCarType
  } = api;
  const columns = [
    { title: language.image, field: 'image', render: rowData => <img alt='Car' src={rowData.image} style={{ width: 50 }} /> },
    { title: language.name, field: 'name' },
    { title: language.base_fare, field: 'base_fare', type: 'numeric' },
    { title: language.rate_per_unit_distance, field: 'rate_per_unit_distance', type: 'numeric' },
    { title: language.rate_per_hour, field: 'rate_per_hour', type: 'numeric' },
    { title: language.min_fare, field: 'min_fare', type: 'numeric' },
    { title: language.convenience_fee, field: 'convenience_fees', type: 'numeric' },
    {
      title: language.convenience_fee_type,
      field: 'convenience_fee_type',
      lookup: { flat: language.flat, percentage: language.percentage },
    },
    { title: language.extra_info, field: 'extra_info' }
  ];

  const subcolumns = [
    { title: language.description, field: 'description', render: rowData => <span>{rowData.description}</span> },
    { title: language.amount, field: 'amount', type: 'numeric' }
  ];

  const [data, setData] = useState([]);
  const cartypes = useSelector(state => state.cartypes);
  const dispatch = useDispatch();
  const rootRef = useRef(null);
  const classes = useStyles();
  const [open,setOpen] = useState(false);
  const [rowIndex,setRowIndex] = useState();
  const [modalType,setModalType] = useState();

  const handleClose = () => {
    setOpen(false);
  }

  useEffect(() => {
    if (cartypes.cars) {
      setData(cartypes.cars);
    } else {
      setData([]);
    }
  }, [cartypes.cars]);

  return (
    cartypes.loading ? <CircularLoading /> :
    <div ref={rootRef}>
      <MaterialTable
        title={language.car_type}
        columns={columns}
        data={data}
        options={{
          exportButton: true,
        }}
        editable={{
          onRowAdd: newData =>
          features.AllowCriticalEditsAdmin?
            new Promise(resolve => {
              setTimeout(() => {
                  newData['createdAt'] = new Date().toISOString();
                  dispatch(editCarType(newData,"Add"));
                  resolve();
              }, 600);
            })
            :
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                alert(language.demo_mode);
              }, 600);
            }),
          onRowUpdate: (newData, oldData) =>
            features.AllowCriticalEditsAdmin?
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                dispatch(editCarType(newData,"Update"));
              }, 600);
            })
            :
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                alert(language.demo_mode);
              }, 600);
            }),
          onRowDelete: oldData =>
            features.AllowCriticalEditsAdmin?
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                dispatch(editCarType(oldData,"Delete"));
              }, 600);
            })
            :
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                alert(language.demo_mode);
              }, 600);
            })
        }}
        actions={[
          rowData => ({
            icon: () => <PhotoSizeSelectSmallIcon />,
            tooltip: language.options,
            disabled: features.AllowCriticalEditsAdmin ? false : true,
            onClick: (event, rowData) => {
              setModalType('parcelTypes')
              setRowIndex(rowData.tableData.id);
              setOpen(true);
            }
          }),
          rowData => ({
            icon: () => <FitnessCenterIcon />,
            tooltip: language.options,
            disabled: features.AllowCriticalEditsAdmin ? false : true,
            onClick: (event, rowData) => {
              setModalType('options')
              setRowIndex(rowData.tableData.id);
              setOpen(true);
            }
          })
        ]}
      />
      <Modal
        disablePortal
        disableEnforceFocus
        disableAutoFocus
        onClose={handleClose}
        open={open}
        className={classes.modal}
        container={() => rootRef.current}
      >
        <div className={classes.paper}>
          <MaterialTable
            title={modalType === 'options'?language.options : language.parcel_types}
            columns={subcolumns}
            data={(data[rowIndex] && data[rowIndex][modalType])?data[rowIndex][modalType]:[]}
            options={{
              exportButton: true,
            }}
            editable={{
              onRowAdd: newData =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    resolve();
                    let tblData = data;
                    if(!tblData[rowIndex][modalType]){
                      tblData[rowIndex][modalType] = [];
                    }
                    tblData[rowIndex][modalType].push(newData);
                    dispatch(editCarType(tblData[rowIndex]), "Update");
                  }, 600);
                }),
              onRowUpdate: (newData, oldData) =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    resolve();
                    let tblData = data;
                    tblData[rowIndex][modalType][tblData[rowIndex][modalType].indexOf(oldData)] = newData;
                    dispatch(editCarType(tblData[rowIndex]), "Update");
                  }, 600);
                }),
              onRowDelete: oldData =>
                new Promise((resolve, reject) => {
                  setTimeout(() => {
                    resolve();
                    let tblData = data;
                    tblData[rowIndex][modalType].splice(tblData[rowIndex][modalType].indexOf(oldData), 1);
                    dispatch(editCarType(tblData[rowIndex]), "Update");
                  }, 600);
                }),
            }}  
          />
        </div>
      </Modal>
    </div>
  );
}
