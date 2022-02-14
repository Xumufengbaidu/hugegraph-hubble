/*
 * @Author: your name
 * @Date: 2022-01-05 14:38:56
 * @LastEditTime: 2022-01-14 18:50:18
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /hubble-fe/src/components/home/home.js
 */
import React, { useState, useContext, useEffect, useMemo } from 'react';
import './Home.less';
import { Select, Menu, Layout } from 'antd';
import { SnippetsOutlined,/* QrcodeOutlined, ToolOutlined */ } from '@ant-design/icons';
import {
    AppStoreContext,
} from '../../stores';
import { Route, Router, useLocation, Redirect, Switch } from 'wouter';
import {
    DataAnalyze,
    MetadataConfigs,
    ImportTasks,
    ImportManager,
} from '../graph-management';
import GraphData from '../graphManagementHook/graphManagement/graphData/GraphData';
import GraphSchema from '../graphManagementHook/graphManagement/graphSchema/GraphSchema';
import Resources from '../graphManagementHook/graphManagement/resources/Resources';
import {
    QueryServiceList,
    StorageService,
    ComputingServices,
    LogManagement,
    AuditManagement,
    PdService
} from '../operations-management'
import { TenantManagement, UserManagement } from '../system-management'
import RoleManagement from '../role-management';
import PerUserManagement from '../user-management'
import Not404Find from '../404'
import api from '../../api/api';

import {
    TaskErrorLogs,
    JobErrorLogs
} from '../graph-management/data-import/import-tasks/error-logs';
import { AsyncTaskList } from '../graph-management';
import AsyncTaskResult from '../graph-management/async-tasks/AsyncTaskResult';
import { useLocationWithConfirmation } from '../../hooks';
import { userAuthArray } from '../../configs/userAuth';

const { Option } = Select;
const { SubMenu } = Menu;
const { Header, Sider, Content } = Layout;
const defaultMenuList = [
    {
        tab: 'dataAnalysis',
        data: [
            {
                key: '0',
                name: 'Gremlin分析'
            },
            {
                key: '1',
                name: '任务管理'
            },
        ]
    },
    {
        tab: 'dataMaintenance',
        data: [
            {
                key: '0',
                name: '原数据配置'
            },
            {
                key: '1',
                name: '数据导入'
            },
            {
                key: '2',
                name: '图管理'
            },
            {
                key: '3',
                name: 'schema管理'
            },
        ]
    },
    {
        tab: 'jurisdiction',
        data: [
            {
                key: '0',
                name: '角色管理'
            },
            {
                key: '1',
                name: '资源管理'
            },
            {
                key: '2',
                name: '用户管理'
            },
        ]
    },
    {
        tab: 'service',
        data: [
            {
                key: '0',
                name: '查询服务'
            },
            {
                key: '1',
                name: '储存服务'
            },
            {
                key: '2',
                name: '计算服务'
            },
            {
                key: '3',
                name: 'PD状态'
            },
        ]
    },
    {
        tab: 'graphspace',
        data: [
            {
                key: '0',
                name: '租户管理'
            }
        ]
    },
    {
        tab: 'userManagement',
        data: [
            {
                key: '0',
                name: '用户管理'
            }
        ]
    },
    {
        tab: 'logManagement',
        data: [
            {
                key: '0',
                name: '日志检索'
            }
        ]
    },
    {
        tab: 'auditManagement',
        data: [
            {
                key: '0',
                name: '审计'
            }
        ]
    },
    {
        tab: 'monitoringManagement',
        data: [
            {
                key: '0',
                name: '监控'
            }
        ]
    },
];
const Home = () => {
    let appStore = useContext(AppStoreContext);
    let [keyObj, setObj] = useState(appStore.menuObj);
    // 左侧菜单栏
    let [userMenu, setUserMenu] = useState([]);
    // 头部导航当前选中值
    let [current, setCurrent] = useState('0');
    // 头部导航菜单数据
    let [menuList, setMenuList] = useState([]);

    const [_, setLocation] = useLocation();

    // 当前租户列表
    let [userListSelect, setUserListSelect] = useState([]);
    // 当前图列表
    let [graphsSelect, setGraphsSelect] = useState([]);
    // 当前选中的图
    let [graphsActive, setGraphsActive] = useState('');
    // 当前选中的租户
    let [userActive, setUserActive] = useState('');

    // 左侧菜单根据用户权限渲染
    const leftMenuAuth = (arr) => {
        return arr.map(item => {
            if (!item.children) {
                return (<Menu.Item key={item.key}>{item.name}</Menu.Item>)
            } else {
                return (<SubMenu key={item.key} icon={<SnippetsOutlined />} title={item.name}>
                    {leftMenuAuth(item.children)}
                </SubMenu>)
            }
        })
    }

    useEffect(() => {
        getTenantList();
        api.getSiderAuthUser().then(res => {
            if (res.status === 200) {
                let target = userAuthArray.find(item => item.name === res.data.level)
                setUserMenu(target.authArray)
            }
        })
    }, []);

    useEffect(() => {
        if (JSON.stringify(keyObj) !== JSON.stringify(appStore.menuObj)) {
            setObj(appStore.menuObj);
        }
        setMenuList(defaultMenuList[appStore.menuObj.c_key - 1].data)
    }, [appStore.menuObj]);

    useEffect(() => {
        current !== appStore.currentKey && setCurrent(appStore.currentKey);
    }, [appStore.currentKey]);

    useEffect(() => {
        appStore.graphs !== "" && setGraphsActive(appStore.graphs);
    }, [appStore.graphs]);

    useEffect(() => {
        if (appStore.tenant !== "null") {
            setUserActive(appStore.tenant)
            getGraphsList();
        };
    }, [appStore.tenant]);

    // 获取租户列表
    const getTenantList = () => {
        api.getGraphspacesList().then((res) => {
            if (res.status === 200
                && res.data.graphspaces
                && res.data.graphspaces.length
            ) {
                appStore.setTenant(res.data.graphspaces[0]);
                setUserListSelect(res.data.graphspaces);
            }
        });
    };

    // 获取图列表
    const getGraphsList = () => {
        if (appStore.tenant !== 'null') {
            api.getGraphsName(appStore.tenant).then(res => {
                if (res.status === 200
                    && res.data.graphs
                    && res.data.graphs.length) {
                    appStore.setGraphs(res.data.graphs[0]);
                    setGraphsSelect(res.data.graphs);
                    return;
                }
                appStore.setGraphs("null");
                setGraphsActive("暂无");
            });
        }
    };

    // 头部导航点击事件
    const handleClick = (e) => {
        setCurrent(e.key);
        if (appStore.menuObj.c_key === '1') {
            if (e.key === '0') {
                setLocation(`/graph-management/0/data-analyze`);
            } else if (e.key === '1') {
                setLocation(`/graph-management/0/async-tasks`);
            }
        } else if (appStore.menuObj.c_key === '2') {
            if (e.key === '0') {
                setLocation(`/graph-management/0/metadata-configs`);
            } else if (e.key === '1') {
                setLocation(`/graph-management/0/data-import/import-manager`);
            } else if (e.key === '2') {
                setLocation(`/graph-management/management`);
            } else if (e.key === '3') {
                setLocation(`/graph-management/schema`);
            }
        } else if (appStore.menuObj.c_key === '3') {
            if (e.key === '1') {
                setLocation(`/graph-management/resources`);
            } else if (e.key === "0") {
                setLocation(`/graph-management/0/role`)
            } else if (e.key === "2") {
                setLocation(`/graph-management/user`)
            }
        } else if (appStore.menuObj.c_key === "4") {
            if (e.key === "0") {
                setLocation(`/operations-management/1/service`)
            } else if (e.key === "1") {
                setLocation(`/operations-management/1/storage`)
            } else if (e.key === "2") {
                setLocation(`/operations-management/1/computing`)
            } else if (e.key === "3") {
                setLocation(`/operations-management/1/pd`)
            }
        } else if (appStore.menuObj.c_key === '5') {
            if (e.key === "0") {
                setLocation(`/system-management/2/tenant`)
            }
        }
    };
    // 左侧菜单栏点击事件
    const menuLeftClick = (e) => {
        if (e.key === appStore.menuObj.c_key) {
            return;
        }
        setCurrent('0');
        appStore.setMenuObj({
            c_key: e.key,
            f_key: e.keyPath[1]
        });
        (_ !== '/monitor') && setMenuList(defaultMenuList[e.key - 1].data);
        if (e.key === '1') {
            setLocation(`/graph-management/0/data-analyze`);
        } else if (e.key === '2') {
            setLocation(`/graph-management/0/metadata-configs`);
        } else if (e.key === '3') {
            setLocation(`/graph-management/0/role`)
        } else if (e.key === '4') {
            setLocation(`/operations-management/1/service`)
        } else if (e.key === '5') {
            setLocation(`/system-management/2/tenant`)
        } else if (e.key === '6') {
            setLocation(`/system-management/2/User`)
        } else if (e.key === '7') {
            setLocation(`/operations-management/1/log`)
        } else if (e.key === '8') {
            setLocation(`/operations-management/1/Audit`)
        } else if (e.key === '9') {
            api.gotoMonitoring().then(res => {
                console.log(res);
            })
        }
    };
    // 点击切换下拉key
    const menuLeftSelect = (e) => {
        setObj((obj) => ({ ...obj, f_key: e[1] || [] }))
        appStore.setMenuObj({
            ...appStore.menuObj,
            f_key: e[1] || []
        })
    }
    // 租户选择器渲染函数
    const selectRender = (arr) => {
        if (!arr.length) {
            return [];
        }
        return arr.map((item) => {
            return (
                <Option
                    key={item}
                    value={item}
                >
                    {item}
                </Option>
            );
        });
    };
    // 切换图名
    const selectGraphsChange = (value) => {
        appStore.setGraphs(value);
        setGraphsActive(value);
    };
    /**
     * @description: 判断是否展示右侧选择图名的头部导航
     * @param {左侧一级导航} f_key
     * @param {左侧二级导航} c_key
     * @param {头部导航} header_key
     * @return {是否展示} bool
     */

    const show_right_header = useMemo(() => {
        if (_ === "/") {
            setCurrent("0")
            setObj({ f_key: 'sub1', c_key: "1" })
            setMenuList(defaultMenuList[0].data)
        }
        if (_ === "/graph-management/0/data-analyze"
            || _ === "/graph-management/0/async-tasks"
            || _ === "/graph-management/0/metadata-configs"
            || _ === "/graph-management/0/data-import/import-manager"
            || _ === "/operations-management/1/computing"
            || _ === "/"
        ) return true
        return false
    }, [_])

    // 切换租户时触发
    const selectChange = (value) => {
        appStore.setTenant(value);
        setUserActive(value);
    };
    // 头部导航菜单栏渲染函数
    const menuRender = (arr) => {
        if (!arr.length) {
            return [];
        }
        return arr.map((item) => {
            return (
                <Menu.Item key={item.key}>
                    {item.name}
                </Menu.Item>
            );
        });
    };

    return (
        <div className='wrapper'>
            <Layout>
                <Header>
                    <div className="header">
                        <div className="header_user">
                            <Select
                                value={userActive ? userActive : "加载中"}
                                loading={userActive ? false : true}
                                style={{ width: 120 }}
                                bordered={false}
                                onChange={selectChange}
                            >
                                {selectRender(userListSelect)}
                            </Select>
                        </div>
                        <div className="header_menu">
                            <Menu
                                onClick={handleClick}
                                selectedKeys={[current]}
                                mode="horizontal"
                                style={{ backgroundColor: "transparent" }}
                            >
                                {menuRender(menuList)}
                            </Menu>
                        </div>
                    </div>
                </Header>
                <Layout>
                    <Sider>
                        <div className="leftTab">
                            <Menu
                                onClick={menuLeftClick}
                                onOpenChange={menuLeftSelect}
                                style={{ width: 256 }}
                                selectedKeys={[keyObj.c_key]}
                                openKeys={[keyObj.f_key]}
                                mode="inline"
                            >
                                {leftMenuAuth(userMenu)}
                            </Menu>
                        </div>
                    </Sider>
                    <Content>
                        <div className="right_content">
                            <div
                                className={
                                    show_right_header ?
                                        'right_content_header' : 'right_content_header none'
                                }
                            >
                                <div className="right_content_header_select">
                                    <Select
                                        value={graphsActive === "null" ? '加载中' : graphsActive}
                                        loading={graphsActive === "null" ? true : false}
                                        style={{ width: 120 }}
                                        bordered={false}
                                        onChange={selectGraphsChange}
                                    >
                                        {selectRender(graphsSelect)}
                                    </Select>
                                </div>
                            </div>
                            {appStore.tenant !== "null" ? <Router hook={useLocationWithConfirmation}>
                                <Switch>
                                    <Route
                                        path="/graph-management/:id/data-import/:jobId/task-error-log/:taskId"
                                        component={TaskErrorLogs}
                                    />
                                    <Route
                                        path="/graph-management/:id/data-import/job-error-log/:jobId"
                                        component={JobErrorLogs}
                                    />
                                    <Route
                                        path="/graph-management/:id/async-tasks/:taskId/result"
                                        component={AsyncTaskResult}
                                    />
                                    <Route
                                        path="/graph-management/:id/data-analyze"
                                        component={DataAnalyze}
                                    />
                                    <Route
                                        path="/graph-management/:id/metadata-configs"
                                        component={MetadataConfigs}
                                    />
                                    <Route
                                        path="/graph-management/:id/data-import/:jobId/import-tasks"
                                        component={ImportTasks}
                                    />
                                    <Route
                                        path="/graph-management/:id/data-import/import-manager/:rest*"
                                        component={ImportManager}
                                    />
                                    <Route
                                        path="/graph-management/:id/async-tasks"
                                        component={AsyncTaskList}
                                    />
                                    {/* <Route path="/graph-management" component={GraphManagement} /> */}
                                    <Route
                                        path="/graph-management/management"
                                        component={GraphData}
                                    />
                                    <Route
                                        path="/graph-management/schema"
                                        component={GraphSchema}
                                    />
                                    <Route
                                        path="/graph-management/resources"
                                        component={Resources}
                                    />
                                    <Route
                                        path="/graph-management/0/role"
                                        component={RoleManagement}
                                    />
                                    <Route
                                        path="/graph-management/user"
                                        component={PerUserManagement}
                                    />
                                    <Route
                                        path="/operations-management/1/service"
                                        component={QueryServiceList}
                                    />
                                    <Route
                                        path="/operations-management/1/storage"
                                        component={StorageService}
                                    />
                                    <Route
                                        path="/operations-management/1/computing"
                                        component={ComputingServices}
                                    />
                                    <Route
                                        path="/system-management/2/tenant"
                                        component={TenantManagement}
                                    />
                                    <Route
                                        path="/system-management/2/User"
                                        component={UserManagement}
                                    />
                                    <Route
                                        path="/operations-management/1/log"
                                        component={LogManagement}
                                    />
                                    <Route
                                        path="/operations-management/1/Audit"
                                        component={AuditManagement}
                                    />
                                    <Route
                                        path="/operations-management/1/pd"
                                        component={PdService}
                                    />
                                    <Route
                                        path="/"
                                        component={DataAnalyze}
                                    />
                                    <Route
                                        path="/404"
                                        component={Not404Find}
                                    />
                                    <Redirect from="*" to="/404" />
                                </Switch>
                            </Router> : null}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </div>
    )
}
export default React.memo(Home)