import { IocContainer } from './common/container.ioc';
import { init as ApplicationInit } from './containers/application.ioc';
import { init as DomainInit } from './containers/domain.ioc';

const IoC = new IocContainer();
export default IoC;

ApplicationInit();
DomainInit();
