package com.example.demo.Controller;
import com.example.demo.Entity.Image;
import com.example.demo.Entity.Server;
import com.example.demo.Entity.Slice;
import com.example.demo.Entity.User;
import com.example.demo.Entity.VirtualMachine;
import com.example.demo.Entity.enums.DriverType;
import com.example.demo.Entity.enums.ImageFormat;
import com.example.demo.Entity.enums.ServerStatus;
import com.example.demo.Entity.enums.SliceStatus;
import com.example.demo.Entity.enums.TopologyType;
import com.example.demo.Entity.enums.UserRole;
import com.example.demo.Entity.enums.VmStatus;
import com.example.demo.Repository.ImageRepository;
import com.example.demo.Repository.ServerRepository;
import com.example.demo.Repository.SliceRepository;
import com.example.demo.Repository.UserRepository;
import com.example.demo.Repository.VirtualMachineRepository;
import org.springframework.stereotype.Controller;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Controller
public class UserController {

    private static final String TEST_USER_ID = "1";
    private static final String TEST_IMAGE_ID = "1";
    private static final String TEST_SERVER_ID = "1";

    private final UserRepository userRepository;
    private final SliceRepository sliceRepository;
    private final ImageRepository imageRepository;
    private final ServerRepository serverRepository;
    private final VirtualMachineRepository virtualMachineRepository;

    public UserController(
            UserRepository userRepository,
            SliceRepository sliceRepository,
            ImageRepository imageRepository,
            ServerRepository serverRepository,
            VirtualMachineRepository virtualMachineRepository) {
        this.userRepository = userRepository;
        this.sliceRepository = sliceRepository;
        this.imageRepository = imageRepository;
        this.serverRepository = serverRepository;
        this.virtualMachineRepository = virtualMachineRepository;
    }

    @GetMapping({ "/user/home"})
    public String mostrarHome() {
        return "user/create_slice";
    }

    @PostMapping("/user/create-slice")
    @ResponseBody
    @Transactional
    public ResponseEntity<Map<String, Object>> crearSlice(@RequestBody Map<String, Object> parametros) {
        System.out.println("========== NUEVO SLICE ==========");
        System.out.println("Parametros recibidos:");
        parametros.forEach((clave, valor) -> System.out.println(clave + ": " + valor));
        System.out.println("=================================");

        User owner = getOrCreateTestUser();
        Image image = getOrCreateTestImage();
        Server server = getOrCreateTestServer();

        String name = String.valueOf(parametros.getOrDefault("name", "Nuevo Slice"));
        String topology = String.valueOf(parametros.getOrDefault("topology", "Lineal"));

        Slice slice = new Slice();
        slice.setOwner(owner);
        slice.setName(name);
        slice.setTopologyType(toTopologyType(topology));
        slice.setStatus(SliceStatus.pending);
        slice.setDriver(DriverType.linux);

        Slice savedSlice = sliceRepository.save(slice);
        List<VirtualMachine> savedVms = saveVirtualMachines(parametros, savedSlice, image, server);

        System.out.println("Slice guardado en DB con id: " + savedSlice.getId());
        System.out.println("VMs guardadas en DB: " + savedVms.size());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Slice creado correctamente",
                "sliceId", savedSlice.getId(),
                "vmCount", savedVms.size()
        ));
    }

    private User getOrCreateTestUser() {
        return userRepository.findById(TEST_USER_ID).orElseGet(() -> {
            User user = new User();
            user.setId(TEST_USER_ID);
            user.setUsername("user");
            user.setEmail("user@example.com");
            user.setPasswordHash("test-password");
            user.setRole(UserRole.user);
            return userRepository.save(user);
        });
    }

    private Image getOrCreateTestImage() {
        return imageRepository.findById(TEST_IMAGE_ID).orElseGet(() -> {
            Image image = new Image();
            image.setId(TEST_IMAGE_ID);
            image.setName("Ubuntu 20.04");
            image.setFormat(ImageFormat.qcow2);
            image.setSizeGb(2.0F);
            image.setPath("/images/ubuntu-20.04.qcow2");
            image.setDriverCompat("[\"linux\"]");
            return imageRepository.save(image);
        });
    }

    private Server getOrCreateTestServer() {
        return serverRepository.findById(TEST_SERVER_ID).orElseGet(() -> {
            Server server = new Server();
            server.setId(TEST_SERVER_ID);
            server.setHostname("server1");
            server.setIpMgmt("127.0.0.1");
            server.setDriver(DriverType.linux);
            server.setTotalCpu(16);
            server.setTotalRam(32768);
            server.setTotalDisk(500);
            server.setUsedCpu(0);
            server.setUsedRam(0);
            server.setUsedDisk(0);
            server.setStatus(ServerStatus.online);
            return serverRepository.save(server);
        });
    }

    private List<VirtualMachine> saveVirtualMachines(
            Map<String, Object> parametros,
            Slice slice,
            Image image,
            Server server) {
        Object vmsObject = parametros.get("vms");
        if (!(vmsObject instanceof List<?> vms)) {
            return List.of();
        }

        List<VirtualMachine> virtualMachines = new ArrayList<>();

        for (Object vmObject : vms) {
            if (!(vmObject instanceof Map<?, ?> vmData)) {
                continue;
            }

            VirtualMachine vm = new VirtualMachine();
            vm.setSlice(slice);
            vm.setImage(image);
            vm.setHost(server);
            vm.setDriver(DriverType.linux);
            vm.setStatus(VmStatus.pending);
            Object vmName = vmData.get("name");
            vm.setName(vmName == null ? "VM" : String.valueOf(vmName));
            vm.setCpu(toInteger(vmData.get("cpu"), 1));
            vm.setRamMb(toInteger(vmData.get("ram"), 1) * 1024);
            vm.setDiskGb(toInteger(vmData.get("disk"), 2));

            virtualMachines.add(vm);
        }

        return virtualMachineRepository.saveAll(virtualMachines);
    }

    private Integer toInteger(Object value, Integer defaultValue) {
        if (value instanceof Number number) {
            return number.intValue();
        }

        if (value instanceof String text) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ignored) {
                return defaultValue;
            }
        }

        return defaultValue;
    }

    private TopologyType toTopologyType(String topology) {
        String normalized = Normalizer.normalize(topology, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);

        return switch (normalized) {
            case "malla" -> TopologyType.mesh;
            case "arbol" -> TopologyType.tree;
            case "anillo" -> TopologyType.ring;
            case "bus" -> TopologyType.bus;
            default -> TopologyType.linear;
        };
    }

}
